// @vitest-environment jsdom

/**
 * Unit tests for CartOrderSummary
 * Requirements: 5.2
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { CartItem } from "@/types/checkout";
import CartOrderSummary from "../CartOrderSummary";

const STUB_ITEM: CartItem = {
  _id: "stub-item-1",
  type: "full_course",
  courseId: "course-1",
  courseTitle: "Test Course",
  thumbnail: "",
  instructorName: "Test Instructor",
  price: 99,
};

const noop = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CartOrderSummary — "Proceed to Checkout" button (Req 5.2)', () => {
  it("is disabled when items array is empty", () => {
    render(
      <CartOrderSummary
        items={[]}
        subtotal={0}
        total={0}
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
        onCheckout={noop}
      />
    );

    expect(
      screen.getByRole("button", { name: /proceed to checkout/i })
    ).not.toBeDisabled();
  });

  it("shows item count when cart has items", () => {
    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={99}
        total={99}
        onCheckout={noop}
      />
    );

    expect(screen.getByText("1 item")).toBeInTheDocument();
  });
});
