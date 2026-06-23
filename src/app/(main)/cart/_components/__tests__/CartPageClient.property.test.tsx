// @vitest-environment jsdom
// Feature: cart-page, Property 5: Failed removal restores the target item
// Feature: cart-page, Property 4: Optimistic removal removes the target item

/**
 * Property 5: Failed removal restores the target item
 *
 * For any non-empty CartItem[] and any index into that array, when the
 * student confirms removal of items[index] but `removeFromCart` returns
 * `false` (simulating a server-side failure), the component MUST:
 *   1. Restore the removed item — its `courseTitle` must reappear in the DOM
 *   2. Show an inline error message visible in the DOM
 *
 * Generator: arbitrary non-empty CartItem[], random index to remove.
 *
 * Validates: Requirements 3.5
 */

import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import * as fc from "fast-check";
import "@testing-library/jest-dom";
import type { CartItem } from "@/types/checkout";
import { CartProvider } from "@/contexts/CartContext";

fc.configureGlobal({ numRuns: 50 });

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...rest
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

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

// Shared push spy — used by both Property 5 and Property 8 tests
const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

vi.mock("@/lib/api/checkout", () => ({
  removeFromCart: vi.fn(),
  getCart: vi.fn(),
}));

vi.mock("@/lib/api/coupon", () => ({
  validateCoupon: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Arbitrary generators
// ---------------------------------------------------------------------------

const nonEmptyPrintableString = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((s) => s.trim().length > 0 && !s.includes("\0"));

const cartItemArb: fc.Arbitrary<CartItem> = fc.record<CartItem>({
  _id: fc.string({ minLength: 1, maxLength: 20 }).map((s) => `id-${s}`),
  type: fc.constant("full_course" as const),
  courseId: fc
    .string({ minLength: 1, maxLength: 20 })
    .map((s) => `course-${s}`),
  courseTitle: nonEmptyPrintableString,
  thumbnail: fc.constant(""),
  instructorName: fc.string({ minLength: 0, maxLength: 40 }),
  price: fc.float({ min: 0, max: 999, noNaN: true }),
  sectionId: fc.constant(undefined),
  sectionTitle: fc.constant(undefined),
});

/**
 * Generates a non-empty CartItem[] with distinct _id, courseId, and
 * courseTitle per item so each renders as a separate full_course card
 * and remove buttons have unique aria-labels.
 */
const nonEmptyCartItemsArb: fc.Arbitrary<CartItem[]> = fc
  .array(cartItemArb, { minLength: 1, maxLength: 6 })
  .map((items) =>
    items.map((item, i) => ({
      ...item,
      _id: `${item._id}-${i}`,
      courseId: `${item.courseId}-${i}`,
      // Append index to ensure all course titles are unique within the array
      courseTitle: `${item.courseTitle}-${i}`,
    })),
  );

/**
 * Generates a [CartItem[], targetIndex] tuple where targetIndex is a valid
 * index into the array.
 */
const itemsWithIndexArb: fc.Arbitrary<[CartItem[], number]> =
  nonEmptyCartItemsArb.chain((items) =>
    fc
      .integer({ min: 0, max: items.length - 1 })
      .map((idx) => [items, idx] as [CartItem[], number]),
  );

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function buildInitialCart(items: CartItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  return { items, subtotal, total: subtotal };
}

async function renderCartPageClient(items: CartItem[]) {
  const { default: CartPageClient } = await import(
    "@/app/(main)/cart/_components/CartPageClient"
  );
  const cart = buildInitialCart(items);
  return render(
    <CartProvider>
      <CartPageClient initialCart={cart} />
    </CartProvider>,
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 5: Failed removal restores the target item", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── Concrete example ──────────────────────────────────────────────────────

  it("restores removed item and shows inline error when removeFromCart returns false", async () => {
    const { removeFromCart } = await import("@/lib/api/checkout");
    vi.mocked(removeFromCart).mockResolvedValue(false);

    const items: CartItem[] = [
      {
        _id: "item-a",
        type: "full_course",
        courseId: "course-a",
        courseTitle: "React Fundamentals",
        thumbnail: "",
        instructorName: "Jane Smith",
        price: 49,
      },
      {
        _id: "item-b",
        type: "full_course",
        courseId: "course-b",
        courseTitle: "TypeScript Advanced",
        thumbnail: "",
        instructorName: "John Doe",
        price: 59,
      },
    ];

    await renderCartPageClient(items);

    // Titles appear in both CartItemList AND CartOrderSummary — use getAllByText
    expect(screen.getAllByText("React Fundamentals").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TypeScript Advanced").length).toBeGreaterThan(0);

    // Click trash button for the first item
    fireEvent.click(
      screen.getByRole("button", { name: /Remove React Fundamentals/i }),
    );

    // Confirm the inline modal
    fireEvent.click(
      screen.getByRole("button", { name: /Confirm remove React Fundamentals/i }),
    );

    // Item must be restored after async failure
    await waitFor(
      () => {
        expect(
          screen.getAllByText("React Fundamentals").length,
        ).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );

    // Inline error must be visible
    await waitFor(
      () => {
        expect(screen.getByText(/Failed to remove/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  // ── Property-based test ───────────────────────────────────────────────────

  it(
    // Feature: cart-page, Property 5: Failed removal restores the target item
    "[property] removed item is restored and an error is shown for any non-empty CartItem[] when removeFromCart returns false — Validates: Requirements 3.5",
    async () => {
      await fc.assert(
        fc.asyncProperty(itemsWithIndexArb, async ([items, targetIdx]) => {
          vi.clearAllMocks();

          const { removeFromCart } = await import("@/lib/api/checkout");
          vi.mocked(removeFromCart).mockResolvedValue(false);

          const targetItem = items[targetIdx];

          const { unmount } = await renderCartPageClient(items);

          try {
            // Target item must be present initially (may appear in both CartItemList and CartOrderSummary)
            expect(
              screen.queryAllByText(targetItem.courseTitle).length,
            ).toBeGreaterThan(0);

            // Click the trash / remove button for the target item
            // Each item has a unique courseTitle (index-suffixed) so the button is unique
            fireEvent.click(
              screen.getByRole("button", {
                name: new RegExp(
                  `Remove ${escapeRegex(targetItem.courseTitle)}`,
                  "i",
                ),
              }),
            );

            // Click "Confirm remove <title>" in the inline modal
            fireEvent.click(
              screen.getByRole("button", {
                name: new RegExp(
                  `Confirm remove ${escapeRegex(targetItem.courseTitle)}`,
                  "i",
                ),
              }),
            );

            // After async settlement, the item must be restored
            await waitFor(
              () => {
                expect(
                  screen.queryAllByText(targetItem.courseTitle).length,
                ).toBeGreaterThan(0);
              },
              { timeout: 3000 },
            );

            // An inline error must be visible
            await waitFor(
              () => {
                const hasErrorText =
                  screen.queryByText(/Failed to remove/i) !== null;
                const hasAlertRole =
                  screen.queryAllByRole("alert").length > 0;
                expect(hasErrorText || hasAlertRole).toBe(true);
              },
              { timeout: 3000 },
            );
          } finally {
            unmount();
          }
        }),
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Feature: cart-page, Property 8: Checkout navigation uses first item's courseId
// ---------------------------------------------------------------------------

/**
 * Property 8: Checkout navigation uses first item's courseId
 *
 * For any non-empty Cart where items[0].courseId is a non-empty string,
 * clicking "Proceed to Checkout" must call router.push with exactly
 * `/checkout/${items[0].courseId}`.
 *
 * Generator: fc.array of CartItem records with at least 1 item, where
 * courseId is a non-empty non-whitespace string.
 *
 * Validates: Requirements 5.3
 */

import { act } from "@testing-library/react";

// Arbitrary for Property 8 — needs non-empty courseId safe for URL usage
const checkoutCartItemsArb = fc.array(
  fc.record({
    _id: fc.uuid(),
    type: fc.constant("full_course" as const),
    courseId: fc
      .string({ minLength: 1, maxLength: 36 })
      .filter((s) => s.trim().length > 0),
    courseTitle: fc
      .string({ minLength: 1, maxLength: 30 })
      .filter((s) => s.trim().length > 0),
    instructorName: fc.string({ minLength: 1 }),
    thumbnail: fc.constant(""),
    price: fc.float({ min: 1, max: 999, noNaN: true }),
  }),
  { minLength: 1, maxLength: 5 },
);

describe("Property 8: Checkout navigation uses first item's courseId", () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  // -- Concrete example: single-item cart -----------------------------------

  it("navigates to /checkout/<courseId> for a single-item cart", async () => {
    const { default: CartPageClient } = await import(
      "@/app/(main)/cart/_components/CartPageClient"
    );

    const cart = {
      items: [
        {
          _id: "item-1",
          type: "full_course" as const,
          courseId: "course-abc-123",
          courseTitle: "Intro to TypeScript",
          thumbnail: "",
          instructorName: "Jane Doe",
          price: 49,
        },
      ],
      subtotal: 49,
      total: 49,
    };

    render(
      <CartProvider>
        <CartPageClient initialCart={cart} />
      </CartProvider>,
    );

    const checkoutBtn = screen.getByRole("button", {
      name: /Proceed to Checkout/i,
    });
    fireEvent.click(checkoutBtn);

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/checkout/course-abc-123");
  });

  // -- Concrete example: multi-item cart (uses first item) ------------------

  it("navigates to /checkout/<courseId> using first item's courseId for a multi-item cart", async () => {
    const { default: CartPageClient } = await import(
      "@/app/(main)/cart/_components/CartPageClient"
    );

    const cart = {
      items: [
        {
          _id: "item-1",
          type: "full_course" as const,
          courseId: "first-course",
          courseTitle: "First Course",
          thumbnail: "",
          instructorName: "Alice",
          price: 29,
        },
        {
          _id: "item-2",
          type: "full_course" as const,
          courseId: "second-course",
          courseTitle: "Second Course",
          thumbnail: "",
          instructorName: "Bob",
          price: 39,
        },
      ],
      subtotal: 68,
      total: 68,
    };

    render(
      <CartProvider>
        <CartPageClient initialCart={cart} />
      </CartProvider>,
    );

    const checkoutBtn = screen.getByRole("button", {
      name: /Proceed to Checkout/i,
    });
    fireEvent.click(checkoutBtn);

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/checkout/first-course");
  });

  // -- Property-based test --------------------------------------------------

  it(
    // Feature: cart-page, Property 8: Checkout navigation uses first item's courseId
    "[property] router.push is called with /checkout/<items[0].courseId> for any non-empty Cart — Validates: Requirements 5.3",
    async () => {
      const { default: CartPageClient } = await import(
        "@/app/(main)/cart/_components/CartPageClient"
      );

      await fc.assert(
        fc.asyncProperty(checkoutCartItemsArb, async (items) => {
          mockRouterPush.mockClear();

          const cart = {
            items,
            subtotal: items.reduce((s, i) => s + i.price, 0),
            total: items.reduce((s, i) => s + i.price, 0),
          };

          const { unmount } = render(
            <CartProvider>
              <CartPageClient initialCart={cart} />
            </CartProvider>,
          );

          try {
            const checkoutBtn = screen.getByRole("button", {
              name: /Proceed to Checkout/i,
            });

            await act(async () => {
              fireEvent.click(checkoutBtn);
            });

            expect(mockRouterPush).toHaveBeenCalledTimes(1);
            expect(mockRouterPush).toHaveBeenCalledWith(
              `/checkout/${items[0].courseId}`,
            );
          } finally {
            unmount();
          }
        }),
      );
    },
  );
});


// ---------------------------------------------------------------------------
// Feature: cart-page, Property 4: Optimistic removal removes the target item
// ---------------------------------------------------------------------------

/**
 * Property 4: Optimistic removal removes the target item
 *
 * For any non-empty CartItem[] and any valid index into that array, when the
 * student confirms removal of items[index] and `removeFromCart` returns `true`
 * (simulating a successful server removal), the component MUST:
 *   1. Remove the item — its `courseTitle` must be absent from the DOM
 *   2. For a single-item cart: the empty state ("Your cart is empty") is shown
 *   3. For a multi-item cart: `queryAllByText(targetItem.courseTitle).length === 0`
 *
 * Generator: arbitrary non-empty `CartItem[]`, random index to remove.
 * Mock `removeFromCart` to return `Promise.resolve(true)`.
 *
 * Validates: Requirements 3.2, 3.7
 */

// Arbitrary for Property 4 — unique _id, courseId, courseTitle per item
const nonEmptyCartItemsArb4 = fc
  .array(
    fc.record({
      _id: fc.string({ minLength: 1, maxLength: 20 }).map((s) => `id-${s}`),
      type: fc.constant("full_course" as const),
      courseId: fc
        .string({ minLength: 1, maxLength: 20 })
        .map((s) => `course-${s}`),
      courseTitle: fc
        .string({ minLength: 3, maxLength: 30 })
        .filter((s) => s.trim().length > 2),
      instructorName: fc.string({ minLength: 0, maxLength: 40 }),
      thumbnail: fc.constant(""),
      price: fc.float({ min: 0, max: 999, noNaN: true }),
      sectionId: fc.constant(undefined),
      sectionTitle: fc.constant(undefined),
    }),
    { minLength: 1, maxLength: 5 },
  )
  .map((items) =>
    items.map((item, i) => ({
      ...item,
      _id: `${item._id}-${i}`,
      courseId: `${item.courseId}-${i}`,
      // Suffix to ensure uniqueness and to avoid cross-property title collisions
      courseTitle: `${item.courseTitle}-prop4-${i}`,
    })),
  );

const itemsWithIndex4Arb: fc.Arbitrary<[CartItem[], number]> =
  nonEmptyCartItemsArb4.chain((items) =>
    fc
      .integer({ min: 0, max: items.length - 1 })
      .map((idx) => [items, idx] as [CartItem[], number]),
  );

describe("Property 4: Optimistic removal removes the target item", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── Concrete example: single-item cart transitions to empty state ─────────

  it("single-item cart: shows empty state after successful removal", async () => {
    const { removeFromCart } = await import("@/lib/api/checkout");
    vi.mocked(removeFromCart).mockResolvedValue(true);

    const items: CartItem[] = [
      {
        _id: "item-only",
        type: "full_course",
        courseId: "course-only",
        courseTitle: "Only Course-prop4-0",
        thumbnail: "",
        instructorName: "Instructor A",
        price: 29,
      },
    ];

    await renderCartPageClient(items);

    expect(screen.getAllByText("Only Course-prop4-0").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", { name: /Remove Only Course-prop4-0/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Confirm remove Only Course-prop4-0/i }),
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(screen.queryAllByText("Only Course-prop4-0").length).toBe(0);
  });

  // ── Concrete example: multi-item cart removes only the target ─────────────

  it("multi-item cart: removed item is absent and other items remain", async () => {
    const { removeFromCart } = await import("@/lib/api/checkout");
    vi.mocked(removeFromCart).mockResolvedValue(true);

    const items: CartItem[] = [
      {
        _id: "item-a",
        type: "full_course",
        courseId: "course-a",
        courseTitle: "React Basics-prop4-0",
        thumbnail: "",
        instructorName: "Alice",
        price: 49,
      },
      {
        _id: "item-b",
        type: "full_course",
        courseId: "course-b",
        courseTitle: "TypeScript Pro-prop4-1",
        thumbnail: "",
        instructorName: "Bob",
        price: 59,
      },
    ];

    await renderCartPageClient(items);

    expect(screen.getAllByText("React Basics-prop4-0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TypeScript Pro-prop4-1").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", { name: /Remove React Basics-prop4-0/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Confirm remove React Basics-prop4-0/i }),
    );

    await waitFor(
      () => {
        expect(screen.queryAllByText("React Basics-prop4-0").length).toBe(0);
      },
      { timeout: 3000 },
    );

    expect(screen.getAllByText("TypeScript Pro-prop4-1").length).toBeGreaterThan(0);
  });

  // ── Property-based test ───────────────────────────────────────────────────

  it(
    // Feature: cart-page, Property 4: Optimistic removal removes the target item
    "[property] target item is absent from DOM after successful removal for any non-empty CartItem[] — Validates: Requirements 3.2, 3.7",
    async () => {
      await fc.assert(
        fc.asyncProperty(itemsWithIndex4Arb, async ([items, targetIdx]) => {
          vi.clearAllMocks();

          const { removeFromCart } = await import("@/lib/api/checkout");
          vi.mocked(removeFromCart).mockResolvedValue(true);

          const targetItem = items[targetIdx];
          const isSingleItem = items.length === 1;

          const { unmount } = await renderCartPageClient(items);

          try {
            // Target item must be present initially
            expect(
              screen.queryAllByText(targetItem.courseTitle).length,
            ).toBeGreaterThan(0);

            // Click the remove (trash) button for the target item
            fireEvent.click(
              screen.getByRole("button", {
                name: new RegExp(
                  `Remove ${escapeRegex(targetItem.courseTitle)}`,
                  "i",
                ),
              }),
            );

            // Confirm the inline modal
            fireEvent.click(
              screen.getByRole("button", {
                name: new RegExp(
                  `Confirm remove ${escapeRegex(targetItem.courseTitle)}`,
                  "i",
                ),
              }),
            );

            if (isSingleItem) {
              // Single-item cart → must transition to empty state
              await waitFor(
                () => {
                  expect(
                    screen.getByText(/Your cart is empty/i),
                  ).toBeInTheDocument();
                },
                { timeout: 2000 },
              );
            } else {
              // Multi-item cart → removed item must be absent
              await waitFor(
                () => {
                  expect(
                    screen.queryAllByText(targetItem.courseTitle).length,
                  ).toBe(0);
                },
                { timeout: 2000 },
              );
            }
          } finally {
            unmount();
          }
        }),
        // Reduce runs to stay within test timeout; 25 runs still gives good coverage
        { numRuns: 25 },
      );
    },
    // Generous timeout: 25 runs × up to ~200ms each + overhead
    30_000,
  );
});
