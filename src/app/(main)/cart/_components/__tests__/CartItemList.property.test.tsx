// @vitest-environment jsdom
// Feature: cart-page, Property 2: Full-course card renders all required fields

/**
 * Property 2: Full-course card renders all required fields
 *
 * For any `CartItem` with `type === "full_course"`, the rendered card must
 * include all four required fields simultaneously:
 *   1. `courseTitle` text
 *   2. `instructorName` text
 *   3. A "Full Course" badge
 *   4. The `price` value
 *
 * Generator: arbitrary CartItem with type="full_course", arbitrary
 * courseTitle (non-empty string), instructorName, and non-negative price.
 *
 * Validates: Requirements 2.1
 */

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import * as fc from "fast-check";
import "@testing-library/jest-dom";
import {
  getCartItemRemoveId,
  groupCartItemsByCourse,
  getOrderedCourseIds,
} from "../cartItemUtils";

fc.configureGlobal({ numRuns: 100 });

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// Mock next/image to render a plain <img> to avoid Next.js internals
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

// Mock next/link to render a plain <a> so jsdom doesn't need the Next.js router
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

// ---------------------------------------------------------------------------
// Arbitrary generators
// ---------------------------------------------------------------------------

/**
 * Generates a non-empty string that avoids control characters / null bytes
 * that can cause issues in DOM text comparisons.
 */
const nonEmptyPrintableString = fc
  .string({ minLength: 1, maxLength: 80 })
  .filter((s) => s.trim().length > 0);

/**
 * Generates an arbitrary CartItem with `type = "full_course"`.
 * courseId is prefixed with "course-" to ensure it never collides with
 * Object.prototype / Array.prototype property names that would break the
 * component's plain-object accumulator in its groupBy reduce step.
 */
const fullCourseCartItemArb: fc.Arbitrary<CartItem> = fc.record<CartItem>({
  _id: nonEmptyPrintableString,
  type: fc.constant("full_course" as const),
  courseId: fc
    .string({ minLength: 1, maxLength: 36 })
    .map((s) => `course-${s}`),
  courseTitle: nonEmptyPrintableString,
  instructorName: fc.string({ minLength: 0, maxLength: 80 }),
  thumbnail: fc.constant(""), // empty → triggers placeholder, avoids image-load issues
  price: fc.float({ min: 0, max: 9999, noNaN: true }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildProps(item: CartItem) {
  const groupedItems = groupCartItemsByCourse([item]);
  return {
    groupedItems,
    orderedCourseIds: getOrderedCourseIds([item]),
    removingIds: new Set<string>(),
    errorIds: new Map<string, string>(),
    onRequestRemove: () => {},
    onDismissError: () => {},
    getRemoveId: getCartItemRemoveId,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 2: Full-course card renders all required fields", () => {
  afterEach(() => {
    cleanup();
  });

  it(
    "[property] course title, instructor, 'Full Course' badge, and price are all present for any full_course CartItem — Validates: Requirements 2.1",
    async () => {
      const { default: CartItemList } = await import(
        "@/app/(main)/cart/_components/CartItemList"
      );

      await fc.assert(
        fc.asyncProperty(fullCourseCartItemArb, async (item) => {
          const { container, unmount } = render(
            <CartItemList {...buildProps(item)} />
          );

          try {
            // Query the inner "flex-1" content area that holds title + instructor + badge
            const contentDiv = container.querySelector(
              "div.flex-1.min-w-0",
            ) as HTMLElement | null;
            expect(contentDiv).not.toBeNull();

            // 1. Course title: the bold <p> inside the content area
            const titleEl = contentDiv!.querySelector(
              "p.font-bold",
            ) as HTMLElement | null;
            expect(titleEl).not.toBeNull();
            expect(titleEl!.textContent).toBe(item.courseTitle);

            // 2. Instructor name: the muted <p> (text-slate-400) inside the content area
            const instructorEl = contentDiv!.querySelector(
              "p.text-slate-400",
            ) as HTMLElement | null;
            expect(instructorEl).not.toBeNull();
            expect(instructorEl!.textContent).toBe(item.instructorName);

            // 3. "Full Course" badge: the <span> with uppercase/tracking styles
            const badgeEl = contentDiv!.querySelector("span") as HTMLElement | null;
            expect(badgeEl).not.toBeNull();
            expect(badgeEl!.textContent).toBe("FULL COURSE");

            // 4. Price must be visible — rendered as "$<price>" in a sibling area
            const priceRegex = new RegExp(
              `\\$${item.price.toFixed(2).replace(".", "\\.")}`,
            );
            expect(
              within(container).getByText(priceRegex),
            ).toBeInTheDocument();
          } finally {
            unmount();
          }
        })
      );
    }
  );
});
