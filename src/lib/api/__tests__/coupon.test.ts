// src/lib/api/__tests__/coupon.test.ts
// Unit tests for validateCoupon
// Requirements: 6.2, 6.4, 6.6

import { describe, it, expect, vi, afterEach } from "vitest";
import { validateCoupon } from "../coupon";

// validateCoupon uses global fetch; we stub it per test.
// In a Node environment (vitest env: "node") there is no built-in fetch stub,
// so we use vi.stubGlobal to inject a mock.

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Helper: build a minimal Response-like object
// ---------------------------------------------------------------------------
function mockResponse(
  status: number,
  body?: unknown,
): Response {
  return {
    status,
    json: () =>
      body !== undefined
        ? Promise.resolve(body)
        : Promise.reject(new SyntaxError("No body")),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Test 1 – Network error (fetch throws) → returns null
// Requirements: 6.6
// ---------------------------------------------------------------------------
describe("validateCoupon — network error", () => {
  it("returns null when fetch throws a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const result = await validateCoupon("SAVE10");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 2 – 500 response → returns null
// Requirements: 6.6
// ---------------------------------------------------------------------------
describe("validateCoupon — 5xx responses", () => {
  it("returns null for a 500 Internal Server Error response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse(500)));

    const result = await validateCoupon("SAVE10");

    expect(result).toBeNull();
  });

  it("returns null for a 503 Service Unavailable response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse(503)));

    const result = await validateCoupon("SAVE10");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 3 – 4xx with JSON error body → CouponValidationResponse with valid: false
// Requirements: 6.4
// ---------------------------------------------------------------------------
describe("validateCoupon — 4xx semantic rejection", () => {
  it("returns { valid: false, discountAmount: 0, updatedTotal: 0, message } for 400 with body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse(400, { message: "Coupon expired" }),
      ),
    );

    const result = await validateCoupon("EXPIRED20");

    expect(result).toEqual({
      valid: false,
      discountAmount: 0,
      updatedTotal: 0,
      message: "Coupon expired",
    });
  });

  it("returns { valid: false, discountAmount: 0, updatedTotal: 0, message: undefined } for 422 with no message field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse(422, { error: "unprocessable" }),
      ),
    );

    const result = await validateCoupon("BADCODE");

    expect(result).toEqual({
      valid: false,
      discountAmount: 0,
      updatedTotal: 0,
      message: undefined,
    });
  });

  it("returns { valid: false } for 404 with non-JSON body (json parse error)", async () => {
    const res = {
      status: 404,
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
    } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));

    const result = await validateCoupon("UNKNOWN");

    expect(result).toEqual({
      valid: false,
      discountAmount: 0,
      updatedTotal: 0,
      message: undefined,
    });
  });
});

// ---------------------------------------------------------------------------
// Test 4 – 200 with valid coupon body → full CouponValidationResponse
// Requirements: 6.2
// ---------------------------------------------------------------------------
describe("validateCoupon — 200 success", () => {
  it("returns the full CouponValidationResponse for a 200 response with a valid coupon", async () => {
    const validBody = {
      valid: true,
      discountAmount: 15,
      updatedTotal: 84.99,
      message: "Coupon applied successfully",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse(200, validBody)),
    );

    const result = await validateCoupon("WELCOME15");

    expect(result).toEqual(validBody);
  });

  it("returns the full CouponValidationResponse for a 200 response with no message field", async () => {
    const validBody = {
      valid: true,
      discountAmount: 10,
      updatedTotal: 39.99,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse(200, validBody)),
    );

    const result = await validateCoupon("SAVE10");

    expect(result).toEqual(validBody);
  });
});
