// @vitest-environment jsdom

/**
 * Unit tests for CartOrderSummary
 * Requirements: 5.2, 6.1, 6.3, 6.6
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { CartItem } from "@/types/checkout";
import CartOrderSummary from "../CartOrderSummary";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Minimal CartItem stub — keeps the checkout button enabled (items.length > 0)
// ---------------------------------------------------------------------------

const STUB_ITEM: CartItem = {
  _id: "stub-item-1",
  type: "full_course",
  courseId: "course-1",
  courseTitle: "Test Course",
  thumbnail: "",
  instructorName: "Test Instructor",
  price: 99,
};

// ---------------------------------------------------------------------------
// Common no-op handlers
// ---------------------------------------------------------------------------

const noop = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test 1 — "Proceed to Checkout" is disabled when items is empty (Req 5.2)
// ---------------------------------------------------------------------------

describe('CartOrderSummary — "Proceed to Checkout" button (Req 5.2)', () => {
  it("is disabled when items array is empty", () => {
    render(
      <CartOrderSummary
        items={[]}
        subtotal={0}
        total={0}
        couponState={{ status: "hidden" }}
        onApplyCoupon={noop}
        onRemoveCoupon={noop}
        onCheckout={noop}
      />
    );

    expect(
      screen.getByRole("button", { name: /proceed to checkout/i })
    ).toBeDisabled();
  });

  it("is enabled when items array has at least one item", () => {
    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={99}
        total={99}
        couponState={{ status: "hidden" }}
        onApplyCoupon={noop}
        onRemoveCoupon={noop}
        onCheckout={noop}
      />
    );

    expect(
      screen.getByRole("button", { name: /proceed to checkout/i })
    ).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Coupon toggle shows/hides input on click (Req 6.1)
// ---------------------------------------------------------------------------

describe("CartOrderSummary — coupon toggle (Req 6.1)", () => {
  it('shows "Have a coupon?" button and hides input initially when status is hidden', () => {
    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={99}
        total={99}
        couponState={{ status: "hidden" }}
        onApplyCoupon={noop}
        onRemoveCoupon={noop}
        onCheckout={noop}
      />
    );

    expect(
      screen.getByRole("button", { name: /have a coupon\?/i })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("textbox", { name: /coupon code/i })
    ).not.toBeInTheDocument();
  });

  it('clicking "Have a coupon?" reveals the coupon code input', () => {
    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={99}
        total={99}
        couponState={{ status: "hidden" }}
        onApplyCoupon={noop}
        onRemoveCoupon={noop}
        onCheckout={noop}
      />
    );

    // Input must NOT be present before toggle
    expect(
      screen.queryByRole("textbox", { name: /coupon code/i })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /have a coupon\?/i }));

    // Input must be present after toggle
    expect(
      screen.getByRole("textbox", { name: /coupon code/i })
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Test 3 — Network error message is distinct from invalid-code message (Req 6.6)
// ---------------------------------------------------------------------------

describe("CartOrderSummary — coupon error messages (Req 6.6)", () => {
  it("shows network error message and does NOT show the invalid-code message", () => {
    const networkMessage =
      "Could not connect to validate the coupon. Please try again.";
    const invalidCodeMessage = "Invalid or expired coupon code";

    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={99}
        total={99}
        couponState={{
          status: "error",
          kind: "network",
          code: "SAVE10",
          message: networkMessage,
        }}
        onApplyCoupon={noop}
        onRemoveCoupon={noop}
        onCheckout={noop}
      />
    );

    // The network error message must be visible
    expect(screen.getByText(networkMessage)).toBeInTheDocument();

    // The invalid-code message must NOT appear
    expect(screen.queryByText(invalidCodeMessage)).not.toBeInTheDocument();
  });

  it("shows invalid-code message and does NOT show the network error message", () => {
    const networkMessage =
      "Could not connect to validate the coupon. Please try again.";
    const invalidCodeMessage = "Invalid or expired coupon code";

    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={99}
        total={99}
        couponState={{
          status: "error",
          kind: "invalid",
          code: "BADCODE",
          message: invalidCodeMessage,
        }}
        onApplyCoupon={noop}
        onRemoveCoupon={noop}
        onCheckout={noop}
      />
    );

    // The invalid-code message must be visible
    expect(screen.getByText(invalidCodeMessage)).toBeInTheDocument();

    // The network error message must NOT appear
    expect(screen.queryByText(networkMessage)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Test 4 — Subtotal and discount rows visible when valid coupon applied (Req 6.3)
// ---------------------------------------------------------------------------

describe("CartOrderSummary — applied coupon discount breakdown (Req 6.3)", () => {
  it("shows Subtotal row, Discount row, and formatted discount amount when coupon applied with discountAmount > 0", () => {
    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={99}
        total={89}
        couponState={{ status: "applied", code: "SAVE10", discountAmount: 10 }}
        onApplyCoupon={noop}
        onRemoveCoupon={noop}
        onCheckout={noop}
      />
    );

    // "Subtotal" label must be in the DOM
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();

    // "Discount" label must be in the DOM
    expect(screen.getByText(/discount/i)).toBeInTheDocument();

    // Discount amount formatted as "-$10.00"
    expect(screen.getByText("-$10.00")).toBeInTheDocument();
  });

  it("does NOT show Discount row when coupon is applied with discountAmount = 0", () => {
    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={99}
        total={99}
        couponState={{ status: "applied", code: "FREE0", discountAmount: 0 }}
        onApplyCoupon={noop}
        onRemoveCoupon={noop}
        onCheckout={noop}
      />
    );

    // "Discount" label must NOT be in the DOM when discountAmount is 0
    expect(screen.queryByText(/^discount$/i)).not.toBeInTheDocument();
  });
});
