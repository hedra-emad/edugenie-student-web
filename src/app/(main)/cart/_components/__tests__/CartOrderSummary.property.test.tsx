// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import * as fc from "fast-check";
import "@testing-library/jest-dom";
import type { CartItem } from "@/types/checkout";

fc.configureGlobal({ numRuns: 100 });

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

const STUB_ITEM: CartItem = {
  _id: "stub-item-1",
  type: "full_course",
  courseId: "course-1",
  courseTitle: "Test Course",
  thumbnail: "",
  instructorName: "Test Instructor",
  price: 0,
};

async function renderSummary(total: number) {
  const { default: CartOrderSummary } = await import(
    "@/app/(main)/cart/_components/CartOrderSummary"
  );

  return render(
    <CartOrderSummary
      items={[STUB_ITEM]}
      subtotal={total}
      total={total}
      onCheckout={vi.fn()}
    />
  );
}

function assertButtonLabelFormatsTotal(total: number): void {
  const button = screen.getByRole("button", { name: /proceed to checkout/i });
  const label = button.textContent ?? "";
  expect(label).toMatch(/\$\d+\.\d{2}/);
  const match = label.match(/\$(\d+\.\d{2})/);
  expect(match).not.toBeNull();
  expect(Number(match![1])).toBe(Number(total.toFixed(2)));
}

describe("Property 9: Checkout button label formats total to two decimal places", () => {
  afterEach(() => cleanup());

  it("[property] button label contains dollar amount equal to total.toFixed(2)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0, max: 100_000, noNaN: true }),
        async (total) => {
          const { unmount } = await renderSummary(total);
          try {
            assertButtonLabelFormatsTotal(total);
          } finally {
            unmount();
          }
        }
      )
    );
  });
});

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

const nonEmptyCartItemsArb: fc.Arbitrary<CartItem[]> = fc.array(cartItemArb, {
  minLength: 1,
  maxLength: 10,
});

describe("Property 1: Subtotal equals sum of item prices", () => {
  afterEach(() => cleanup());

  it("[property] subtotal row displays sum of item prices formatted to two decimals", async () => {
    const { default: CartOrderSummary } = await import(
      "@/app/(main)/cart/_components/CartOrderSummary"
    );

    await fc.assert(
      fc.asyncProperty(nonEmptyCartItemsArb, async (items) => {
        const subtotal = items.reduce((s, i) => s + i.price, 0);
        const { unmount } = render(
          <CartOrderSummary
            items={items}
            subtotal={subtotal}
            total={subtotal}
            onCheckout={vi.fn()}
          />
        );
        try {
          const subtotalLabel = screen.getByText("Subtotal");
          const row = subtotalLabel.closest("div") as HTMLElement;
          expect(row.textContent).toContain(`$${subtotal.toFixed(2)}`);
        } finally {
          unmount();
        }
      })
    );
  });
});
