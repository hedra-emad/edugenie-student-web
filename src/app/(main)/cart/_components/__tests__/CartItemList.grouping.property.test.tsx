// @vitest-environment jsdom
// Feature: cart-page, Property 3: Section items are grouped by courseId

/**
 * Property 3: Section items are grouped by courseId
 *
 * For any array of CartItems with `type === "section"` and varying courseId
 * values, the rendered output must show each unique courseId's course title
 * in a group header exactly once — regardless of how many section rows that
 * course contributes.
 *
 * Generator: arbitrary array of CartItem objects with type="section" and
 * courseId drawn from a fixed pool {"c1","c2","c3"} so groups are
 * predictably non-trivial.
 *
 * Validates: Requirements 2.2
 */

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import * as fc from "fast-check";
import "@testing-library/jest-dom";
import type { CartItem } from "@/types/checkout";

fc.configureGlobal({ numRuns: 50 });

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// Mock next/image to render a plain <img> to avoid Next.js image internals
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
// Arbitrary generator
// ---------------------------------------------------------------------------

/**
 * Maps courseId to a stable courseTitle so we can verify titles later.
 * Using constantFrom pools ensures the same courseId always has the same title.
 */
const COURSE_ID_TITLE_MAP: Record<string, string> = {
  c1: "Course One",
  c2: "Course Two",
  c3: "Course Three",
};

/**
 * Generates an arbitrary section CartItem.
 * courseId is drawn from a fixed pool so multiple items can share the same
 * courseId, producing genuine grouping scenarios.
 */
const sectionCartItemArb: fc.Arbitrary<CartItem> = fc
  .record({
    _id: fc.uuid(),
    type: fc.constant("section" as const),
    courseId: fc.constantFrom("c1", "c2", "c3"),
    courseTitle: fc.constantFrom("Course One", "Course Two", "Course Three"),
    thumbnail: fc.constant(""),
    instructorName: fc.constant("Instructor"),
    sectionTitle: fc.string({ minLength: 1, maxLength: 30 }),
    price: fc.float({ min: 0, max: 999, noNaN: true }),
  })
  // Ensure courseTitle is consistent with courseId
  .map((item) => ({
    ...item,
    courseTitle: COURSE_ID_TITLE_MAP[item.courseId],
  }));

/**
 * Generates an array of 1–10 section items.
 */
const sectionItemsArb: fc.Arbitrary<CartItem[]> = fc.array(sectionCartItemArb, {
  minLength: 1,
  maxLength: 10,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 3: Section items are grouped by courseId", () => {
  afterEach(() => {
    cleanup();
  });

  it(
    "[property] each unique courseId's course title appears exactly once as a group header — Validates: Requirements 2.2",
    async () => {
      const { default: CartItemList } = await import(
        "@/app/(main)/cart/_components/CartItemList"
      );

      await fc.assert(
        fc.asyncProperty(sectionItemsArb, async (items) => {
          // Build a map of courseId -> courseTitle from the generated items
          const courseMap = new Map<string, string>();
          for (const item of items) {
            if (!courseMap.has(item.courseId)) {
              courseMap.set(item.courseId, item.courseTitle);
            }
          }

          const { container, unmount } = render(
            <CartItemList
              items={items}
              removingIds={new Set<string>()}
              errorIds={new Map<string, string>()}
              onRequestRemove={vi.fn()}
              onDismissError={vi.fn()}
            />
          );

          try {
            // For each unique courseId, the courseTitle should appear exactly
            // once in the DOM (the group header <p> element).
            // Section rows show sectionTitle, not courseTitle, so courseTitle
            // should only appear as the group header.
            for (const [, courseTitle] of courseMap) {
              // Find all elements whose exact text content matches the courseTitle
              const allMatches = Array.from(
                container.querySelectorAll("p, span, h1, h2, h3, h4, h5, h6")
              ).filter((el) => el.textContent?.trim() === courseTitle);

              expect(
                allMatches.length,
                `Expected courseTitle "${courseTitle}" to appear exactly once as a group header, but found ${allMatches.length} matches`
              ).toBe(1);
            }
          } finally {
            unmount();
          }
        })
      );
    }
  );
});
