// src/lib/api/coupon.ts
import type { CouponValidationResponse } from "@/types/coupon";

const REMOTE_API =
  process.env.NEXT_PUBLIC_API_URL ?? "https://edugenie-api.vercel.app";

function baseUrl(): string {
  return REMOTE_API;
}

export async function validateCoupon(
  code: string,
): Promise<CouponValidationResponse | null> {
  try {
    const res = await fetch(`${baseUrl()}/coupon/validate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    // 5xx — non-semantic server error: treat as network-level failure
    if (res.status >= 500) {
      return null;
    }

    // 4xx — semantic rejection: parse body and return CouponValidationResponse with valid: false
    if (res.status >= 400) {
      let message: string | undefined;
      try {
        const body = await res.json();
        if (body && typeof body.message === "string") {
          message = body.message;
        }
      } catch {
        // ignore parse errors; return generic rejection
      }
      return {
        valid: false,
        discountAmount: 0,
        updatedTotal: 0,
        message,
      };
    }

    // 200 — parse and return the full response
    return (await res.json()) as CouponValidationResponse;
  } catch {
    // Network error (fetch threw)
    return null;
  }
}
