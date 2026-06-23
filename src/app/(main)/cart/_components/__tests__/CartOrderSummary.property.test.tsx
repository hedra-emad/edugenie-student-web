// @vitest-environment jsdom
// Feature: cart-page, Property 1: Subtotal equals sum of item prices
// Feature: cart-page, Property 9: Checkout button label formats total to two decimal places

/**
 * Property 9: Checkout button label formats total to two decimal places
 *
 * For any non-negative Cart.total value, the "Proceed to Checkout" button
 * rendered by CartOrderSummary must:
 *   1. Contain a dollar-formatted amount matching /\$\d+\.\d{2}/
 *   2. Have the numeric portion equal to the input total rounded to exactly
 *      two decimal places (i.e., Number(total.toFixed(2)))
 *
 * Examples:
 *   49    → "Proceed to Checkout — $49.00"
 *   49.5  → "Proceed to Checkout — $49.50"
 *   0     → "Proceed to Checkout — $0.00"
 *
 * Generator: fc.float({ min: 0, max: 100_000, noNaN: true })
 *
 * Validates: Requirements 5.5
 */

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import * as fc from "fast-check";
import "@testing-library/jest-dom";

fc.configureGlobal({ numRuns: 100 });

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// CartOrderSummary uses no router or Link calls directly, but mock
// next/link defensively in case internal sub-components use it.
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
// Minimal CartItem stub that keeps the button enabled (items.length > 0)
// ---------------------------------------------------------------------------

const STUB_ITEM = {
  _id: "stub-item-1",
  type: "full_course" as const,
  courseId: "course-1",
  courseTitle: "Test Course",
  thumbnail: "",
  instructorName: "Test Instructor",
  price: 0,
};

// ---------------------------------------------------------------------------
// Helper: render CartOrderSummary with a given total
// ---------------------------------------------------------------------------

async function renderSummary(total: number) {
  const { default: CartOrderSummary } = await import(
    "@/app/(main)/cart/_components/CartOrderSummary"
  );

  return render(
    <CartOrderSummary
      items={[STUB_ITEM]}
      subtotal={total}
      total={total}
      couponState={{ status: "hidden" }}
      onApplyCoupon={vi.fn()}
      onRemoveCoupon={vi.fn()}
      onCheckout={vi.fn()}
    />
  );
}

// ---------------------------------------------------------------------------
// Assertion helper
// ---------------------------------------------------------------------------

function assertButtonLabelFormatsTotal(total: number): void {
  // The button text: "Proceed to Checkout — $X.XX"
  const button = screen.getByRole("button", {
    name: /Proceed to Checkout/i,
  });

  const label = button.textContent ?? "";

  // 1. Must contain a dollar-amount with exactly two decimal places
  expect(label).toMatch(/\$\d+\.\d{2}/);

  // 2. Extract the numeric portion and compare to total.toFixed(2)
  const match = label.match(/\$(\d+\.\d{2})/);
  expect(match).not.toBeNull();

  const renderedAmount = parseFloat(match![1]);
  const expectedAmount = parseFloat(total.toFixed(2));

  expect(renderedAmount).toBe(expectedAmount);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 9: Checkout button label formats total to two decimal places", () => {
  afterEach(() => {
    cleanup();
  });

  // -- Concrete examples ----------------------------------------------------

  it("formats integer total 49 as $49.00", async () => {
    await renderSummary(49);
    assertButtonLabelFormatsTotal(49);
  });

  it("formats one-decimal total 49.5 as $49.50", async () => {
    await renderSummary(49.5);
    assertButtonLabelFormatsTotal(49.5);
  });

  it("formats zero total as $0.00", async () => {
    await renderSummary(0);
    assertButtonLabelFormatsTotal(0);
  });

  // -- Property-based test --------------------------------------------------

  it(
    "[property] button label always contains total formatted to two decimal places for any non-negative total — Validates: Requirements 5.5",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: 0, max: 100_000, noNaN: true }),
          async (total) => {
            const { default: CartOrderSummary } = await import(
              "@/app/(main)/cart/_components/CartOrderSummary"
            );

            const { unmount } = render(
              <CartOrderSummary
                items={[STUB_ITEM]}
                subtotal={total}
                total={total}
                couponState={{ status: "hidden" }}
                onApplyCoupon={vi.fn()}
                onRemoveCoupon={vi.fn()}
                onCheckout={vi.fn()}
              />
            );

            try {
              assertButtonLabelFormatsTotal(total);
            } finally {
              unmount();
            }
          }
        )
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Feature: cart-page, Property 11: Valid coupon renders discount breakdown and flips button
// ---------------------------------------------------------------------------

/**
 * Property 11: Valid coupon renders discount breakdown and flips button
 *
 * When the component receives couponState = { status: "applied", code, discountAmount }
 * with discountAmount > 0 and at least one item is present, it must:
 *   1. Render "Subtotal" text
 *   2. Render "Discount" label
 *   3. Render a "Remove" button
 *   4. NOT render a coupon <input> (aria-label="Coupon code")
 *
 * Generator: fc.float({ min: 0.01, max: 500, noNaN: true }) for discountAmount
 *
 * Validates: Requirements 6.3
 */

describe("Property 11: Valid coupon renders discount breakdown and flips button", () => {
  afterEach(() => {
    cleanup();
  });

  // -- Concrete examples ----------------------------------------------------

  it("shows Subtotal, Discount, Remove button and hides coupon input when coupon applied", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );

    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={99}
        total={89}
        couponState={{ status: "applied", code: "SAVE10", discountAmount: 10 }}
        onApplyCoupon={vi.fn()}
        onRemoveCoupon={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    // "Subtotal" label present
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    // "Discount" label present
    expect(screen.getByText(/discount/i)).toBeInTheDocument();
    // "Remove" button present
    expect(
      screen.getByRole("button", { name: /remove/i })
    ).toBeInTheDocument();
    // Coupon input absent
    expect(
      screen.queryByRole("textbox", { name: /coupon code/i })
    ).not.toBeInTheDocument();
  });

  // -- Property-based test --------------------------------------------------

  it(
    "[property] applied coupon always shows Subtotal, Discount, Remove and hides input for any discountAmount > 0 — Validates: Requirements 6.3",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: Math.fround(0.01), max: Math.fround(500), noNaN: true }),
          async (discount) => {
            const { default: CartOrderSummary } = await import(
              "@/app/(main)/cart/_components/CartOrderSummary"
            );

            const subtotal = 500;
            const total = Math.max(0, subtotal - discount);

            const { unmount } = render(
              <CartOrderSummary
                items={[STUB_ITEM]}
                subtotal={subtotal}
                total={total}
                couponState={{
                  status: "applied",
                  code: "SAVE",
                  discountAmount: discount,
                }}
                onApplyCoupon={vi.fn()}
                onRemoveCoupon={vi.fn()}
                onCheckout={vi.fn()}
              />
            );

            try {
              // 1. "Subtotal" must be present (items.length > 0)
              expect(screen.getByText(/subtotal/i)).toBeInTheDocument();

              // 2. "Discount" label must be present (discountAmount > 0)
              expect(screen.getByText(/discount/i)).toBeInTheDocument();

              // 3. "Remove" button must be present (applied state)
              expect(
                screen.getByRole("button", { name: /remove/i })
              ).toBeInTheDocument();

              // 4. Coupon input must be absent (hidden when applied)
              expect(
                screen.queryByRole("textbox", { name: /coupon code/i })
              ).not.toBeInTheDocument();
            } finally {
              unmount();
            }
          }
        )
      );
    }
  );
});


// ---------------------------------------------------------------------------
// Property 1: Subtotal equals sum of item prices
// ---------------------------------------------------------------------------

/**
 * Property 1: Subtotal equals sum of item prices
 *
 * For any non-empty array of CartItems with arbitrary non-negative prices,
 * the rendered Subtotal row must display a value equal to the sum of all
 * item prices (i.e., items.reduce((s, i) => s + i.price, 0)).
 *
 * The component renders `${subtotal}` directly (no toFixed), so we pass
 * expectedSubtotal as the subtotal prop and verify the DOM text matches.
 *
 * Generator: CartItem[] (min 1) with type="full_course",
 *            prices from fc.float({ min: 0, max: 1000, noNaN: true })
 *
 * Validates: Requirements 2.3
 */

import type { CartItem } from "@/types/checkout";

// ---------------------------------------------------------------------------
// Arbitrary generators for Property 1
// ---------------------------------------------------------------------------

/**
 * Generates a single CartItem with type="full_course" and a non-negative price.
 */
const cartItemArb: fc.Arbitrary<CartItem> = fc.record<CartItem>({
  _id: fc.string({ minLength: 1, maxLength: 40 }),
  type: fc.constant("full_course" as const),
  courseId: fc.string({ minLength: 1, maxLength: 40 }),
  courseTitle: fc
    .string({ minLength: 1, maxLength: 80 })
    .filter((s) => s.trim().length > 0),
  thumbnail: fc.constant(""),
  instructorName: fc.string({ minLength: 0, maxLength: 80 }),
  price: fc.float({ min: 0, max: 1000, noNaN: true }),
});

/**
 * Generates a non-empty array of CartItems (at least 1 item).
 */
const nonEmptyCartItemsArb: fc.Arbitrary<CartItem[]> = fc.array(cartItemArb, {
  minLength: 1,
  maxLength: 10,
});

// ---------------------------------------------------------------------------
// Tests for Property 1
// ---------------------------------------------------------------------------

describe("Property 1: Subtotal equals sum of item prices", () => {
  afterEach(() => {
    cleanup();
  });

  // -- Concrete examples ----------------------------------------------------

  it("renders subtotal $10 for a single item priced at 10", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );
    const items: CartItem[] = [
      {
        _id: "1",
        type: "full_course",
        courseId: "c1",
        courseTitle: "Course A",
        thumbnail: "",
        instructorName: "Instructor",
        price: 10,
      },
    ];
    const subtotal = items.reduce((s, i) => s + i.price, 0);
    render(
      <CartOrderSummary
        items={items}
        subtotal={subtotal}
        total={subtotal}
        couponState={{ status: "hidden" }}
        onApplyCoupon={vi.fn()}
        onRemoveCoupon={vi.fn()}
        onCheckout={vi.fn()}
      />
    );
    const subtotalLabel = screen.getByText("Subtotal");
    const row = subtotalLabel.closest("div") as HTMLElement;
    expect(row.textContent).toContain(`$${subtotal}`);
    cleanup();
  });

  it("renders subtotal $30 for three items each priced at 10", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );
    const makeItem = (id: string): CartItem => ({
      _id: id,
      type: "full_course",
      courseId: "c1",
      courseTitle: "Course A",
      thumbnail: "",
      instructorName: "Instructor",
      price: 10,
    });
    const items = [makeItem("1"), makeItem("2"), makeItem("3")];
    const subtotal = items.reduce((s, i) => s + i.price, 0); // 30
    render(
      <CartOrderSummary
        items={items}
        subtotal={subtotal}
        total={subtotal}
        couponState={{ status: "hidden" }}
        onApplyCoupon={vi.fn()}
        onRemoveCoupon={vi.fn()}
        onCheckout={vi.fn()}
      />
    );
    const subtotalLabel = screen.getByText("Subtotal");
    const row = subtotalLabel.closest("div") as HTMLElement;
    expect(row.textContent).toContain(`$${subtotal}`);
    cleanup();
  });

  // -- Property-based test --------------------------------------------------

  it(
    "[property] rendered Subtotal text equals sum of all item prices for any non-empty CartItem[] — Validates: Requirements 2.3",
    async () => {
      const { default: CartOrderSummary } = await import(
        "@/app/(main)/cart/_components/CartOrderSummary"
      );

      await fc.assert(
        fc.asyncProperty(nonEmptyCartItemsArb, async (items) => {
          // Compute expected subtotal the same way as the consumer would
          const expectedSubtotal = items.reduce((s, i) => s + i.price, 0);

          const { unmount } = render(
            <CartOrderSummary
              items={items}
              subtotal={expectedSubtotal}
              total={expectedSubtotal}
              couponState={{ status: "hidden" }}
              onApplyCoupon={vi.fn()}
              onRemoveCoupon={vi.fn()}
              onCheckout={vi.fn()}
            />
          );

          try {
            // The component renders `${subtotal}` directly in a span next to "Subtotal"
            const subtotalLabel = screen.getByText("Subtotal");
            const row = subtotalLabel.closest("div") as HTMLElement;

            // The row container text should include "$<expectedSubtotal>"
            expect(row.textContent).toContain(`$${expectedSubtotal}`);
          } finally {
            unmount();
          }
        })
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Feature: cart-page, Property 12: Invalid coupon leaves total unchanged
// ---------------------------------------------------------------------------

/**
 * Property 12: Invalid coupon leaves total unchanged
 *
 * When the component receives couponState = { status: "error", ... } (a rejected
 * coupon), the displayed Total must equal the original Cart.total rendered with
 * exactly two decimal places (i.e., `$${total.toFixed(2)}`).
 *
 * The total is always rendered via:
 *   <span style={{ color: "#3B1892" }}>${total.toFixed(2)}</span>
 *
 * Generator: fc.float({ min: 0, max: 100_000, noNaN: true }) for originalTotal
 *
 * Validates: Requirements 6.4
 */

describe("Property 12: Invalid coupon leaves total unchanged", () => {
  afterEach(() => {
    cleanup();
  });

  // -- Concrete examples ----------------------------------------------------

  it("total row shows original total when coupon status is error (integer value)", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );

    const originalTotal = 75;
    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={originalTotal}
        total={originalTotal}
        couponState={{
          status: "error",
          code: "BAD",
          message: "Invalid or expired coupon code",
          kind: "invalid",
        }}
        onApplyCoupon={vi.fn()}
        onRemoveCoupon={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    expect(screen.getByText(`$${originalTotal.toFixed(2)}`)).toBeInTheDocument();
  });

  it("total row shows original total when coupon status is error (decimal value)", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );

    const originalTotal = 49.99;
    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={originalTotal}
        total={originalTotal}
        couponState={{
          status: "error",
          code: "BAD",
          message: "Invalid or expired coupon code",
          kind: "invalid",
        }}
        onApplyCoupon={vi.fn()}
        onRemoveCoupon={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    // Scope to the Total row to avoid ambiguity with the Subtotal row
    const totalLabel = screen.getByText("Total");
    const totalRow = totalLabel.closest("div") as HTMLElement;
    expect(totalRow.textContent).toContain(`$${originalTotal.toFixed(2)}`);
  });

  it("total row shows $0.00 when total is zero and coupon is in error state", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );

    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={0}
        total={0}
        couponState={{
          status: "error",
          code: "BAD",
          message: "Invalid or expired coupon code",
          kind: "invalid",
        }}
        onApplyCoupon={vi.fn()}
        onRemoveCoupon={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  // -- Property-based test --------------------------------------------------

  it(
    "[property] total row always shows original total unchanged for any originalTotal when coupon is in error state — Validates: Requirements 6.4",
    async () => {
      // Feature: cart-page, Property 12: Invalid coupon leaves total unchanged
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: 0, max: 100_000, noNaN: true }),
          async (originalTotal) => {
            const { default: CartOrderSummary } = await import(
              "@/app/(main)/cart/_components/CartOrderSummary"
            );

            const { unmount } = render(
              <CartOrderSummary
                items={[STUB_ITEM]}
                subtotal={originalTotal}
                total={originalTotal}
                couponState={{
                  status: "error",
                  code: "BAD",
                  message: "Invalid or expired coupon code",
                  kind: "invalid",
                }}
                onApplyCoupon={vi.fn()}
                onRemoveCoupon={vi.fn()}
                onCheckout={vi.fn()}
              />
            );

            try {
              // The Total row must display exactly `$${originalTotal.toFixed(2)}`
              // Scope to the Total label's parent row to avoid ambiguity with
              // the Subtotal row, which may render the same numeric string.
              const totalLabel = screen.getByText("Total");
              const totalRow = totalLabel.closest("div") as HTMLElement;
              expect(totalRow.textContent).toContain(`$${originalTotal.toFixed(2)}`);
            } finally {
              unmount();
            }
          }
        )
      );
    }
  );
});


// ---------------------------------------------------------------------------
// Feature: cart-page, Property 13: Applied coupon hides the coupon input field
// ---------------------------------------------------------------------------

/**
 * Property 13: Applied coupon hides the coupon input field
 *
 * For any state where couponState.status === "applied", the coupon text
 * <input> (aria-label="Coupon code") must NOT be present in the DOM.
 *
 * Generator: fc.tuple(
 *   fc.string({ minLength: 1, maxLength: 20 }),
 *   fc.float({ min: Math.fround(0.01), max: Math.fround(500), noNaN: true })
 * ) for [code, discountAmount]
 *
 * Validates: Requirements 6.7
 */

describe("Property 13: Applied coupon hides the coupon input field", () => {
  afterEach(() => {
    cleanup();
  });

  // -- Concrete example -----------------------------------------------------

  it("hides the coupon input when coupon is applied", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );

    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={100}
        total={90}
        couponState={{ status: "applied", code: "TEST20", discountAmount: 10 }}
        onApplyCoupon={vi.fn()}
        onRemoveCoupon={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    expect(
      screen.queryByRole("textbox", { name: /coupon code/i })
    ).toBeNull();
  });

  // -- Property-based test --------------------------------------------------

  it(
    // Feature: cart-page, Property 13: Applied coupon hides the coupon input field
    "[property] coupon input is absent for any applied coupon state — Validates: Requirements 6.7",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.float({ min: Math.fround(0.01), max: Math.fround(500), noNaN: true })
          ),
          async ([code, discountAmount]) => {
            const { default: CartOrderSummary } = await import(
              "@/app/(main)/cart/_components/CartOrderSummary"
            );

            const { unmount } = render(
              <CartOrderSummary
                items={[STUB_ITEM]}
                subtotal={500}
                total={Math.max(0, 500 - discountAmount)}
                couponState={{ status: "applied", code, discountAmount }}
                onApplyCoupon={vi.fn()}
                onRemoveCoupon={vi.fn()}
                onCheckout={vi.fn()}
              />
            );

            try {
              // The coupon text input must NOT be present in the DOM
              expect(
                screen.queryByRole("textbox", { name: /coupon code/i })
              ).toBeNull();
            } finally {
              unmount();
            }
          }
        )
      );
    }
  );
});


// ---------------------------------------------------------------------------
// Feature: cart-page, Property 10: Coupon Apply is called for any non-empty code; skipped for empty
// ---------------------------------------------------------------------------

/**
 * Property 10: Coupon Apply is called for any non-empty code; skipped for empty
 *
 * For any string of length 0–100 typed into the coupon input:
 *   - If code.trim().length >= 1  → `onApplyCoupon` is called with the
 *     trimmed + uppercased code
 *   - If code.trim().length === 0 → `onApplyCoupon` is NOT called and the
 *     "Please enter a coupon code" validation message is shown
 *
 * Implementation note:
 *   The component's onChange handler calls `.toUpperCase()` on every keystroke,
 *   so `inputCode` is always uppercase before `handleApplyClick` runs.
 *   `handleApplyClick` then calls `onApplyCoupon(inputCode.trim())`.
 *
 * Generator: fc.string({ minLength: 0, maxLength: 100 })
 *
 * Validates: Requirements 6.2, 6.5
 */

import { fireEvent } from "@testing-library/react";

describe("Property 10: Coupon Apply is called for any non-empty code; skipped for empty", () => {
  afterEach(() => {
    cleanup();
  });

  // ── Concrete examples ──────────────────────────────────────────────────────

  it("calls onApplyCoupon with uppercased trimmed code for a normal string", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );
    const onApplyCoupon = vi.fn().mockResolvedValue(undefined);

    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={100}
        total={100}
        couponState={{ status: "hidden" }}
        onApplyCoupon={onApplyCoupon}
        onRemoveCoupon={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    // Open the coupon section
    fireEvent.click(screen.getByText(/have a coupon/i));

    const input = screen.getByLabelText(/coupon code/i);
    const applyBtn = screen.getByRole("button", { name: /^apply$/i });

    fireEvent.change(input, { target: { value: "save10" } });
    fireEvent.click(applyBtn);

    expect(onApplyCoupon).toHaveBeenCalledTimes(1);
    expect(onApplyCoupon).toHaveBeenCalledWith("SAVE10");
  });

  it("does NOT call onApplyCoupon and shows validation message for an empty string", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );
    const onApplyCoupon = vi.fn().mockResolvedValue(undefined);

    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={100}
        total={100}
        couponState={{ status: "hidden" }}
        onApplyCoupon={onApplyCoupon}
        onRemoveCoupon={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/have a coupon/i));

    const input = screen.getByLabelText(/coupon code/i);
    const applyBtn = screen.getByRole("button", { name: /^apply$/i });

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(applyBtn);

    expect(onApplyCoupon).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter a coupon code"
    );
  });

  it("does NOT call onApplyCoupon and shows validation message for a whitespace-only string", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );
    const onApplyCoupon = vi.fn().mockResolvedValue(undefined);

    render(
      <CartOrderSummary
        items={[STUB_ITEM]}
        subtotal={100}
        total={100}
        couponState={{ status: "hidden" }}
        onApplyCoupon={onApplyCoupon}
        onRemoveCoupon={vi.fn()}
        onCheckout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/have a coupon/i));

    const input = screen.getByLabelText(/coupon code/i);
    const applyBtn = screen.getByRole("button", { name: /^apply$/i });

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(applyBtn);

    expect(onApplyCoupon).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter a coupon code"
    );
  });

  // ── Property-based test ────────────────────────────────────────────────────

  it(
    "[property] onApplyCoupon called iff trimmed code is non-empty, else validation message shown — Validates: Requirements 6.2, 6.5",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 100 }),
          async (code) => {
            const { default: CartOrderSummary } = await import(
              "@/app/(main)/cart/_components/CartOrderSummary"
            );
            const onApplyCoupon = vi.fn().mockResolvedValue(undefined);

            const { unmount } = render(
              <CartOrderSummary
                items={[STUB_ITEM]}
                subtotal={100}
                total={100}
                couponState={{ status: "hidden" }}
                onApplyCoupon={onApplyCoupon}
                onRemoveCoupon={vi.fn()}
                onCheckout={vi.fn()}
              />
            );

            try {
              // Reveal the coupon input
              fireEvent.click(screen.getByText(/have a coupon/i));

              const input = screen.getByLabelText(/coupon code/i);
              const applyBtn = screen.getByRole("button", { name: /^apply$/i });

              // Type the generated string — the onChange handler uppercases it
              fireEvent.change(input, { target: { value: code } });
              fireEvent.click(applyBtn);

              const trimmedUpper = code.toUpperCase().trim();

              if (trimmedUpper.length >= 1) {
                // Non-empty: onApplyCoupon must be called with the trimmed+uppercased code
                expect(onApplyCoupon).toHaveBeenCalledTimes(1);
                expect(onApplyCoupon).toHaveBeenCalledWith(trimmedUpper);
              } else {
                // Empty / whitespace-only: must NOT call onApplyCoupon
                expect(onApplyCoupon).not.toHaveBeenCalled();
                // Validation message must be visible
                expect(screen.getByRole("alert")).toHaveTextContent(
                  "Please enter a coupon code"
                );
              }
            } finally {
              unmount();
            }
          }
        )
      );
    }
  );
});
