// @vitest-environment jsdom
// Feature: cart-page, Property 6: Empty state shows all three required elements simultaneously

/**
 * Property 6: Empty state shows all three required elements simultaneously
 *
 * For any render of `CartEmptyState`, asserts that all three required elements
 * are present in the DOM at the same time:
 *   1. A non-text graphic element (SVG)
 *   2. The text "Your cart is empty"
 *   3. The "Browse Courses" button / link
 *
 * CartEmptyState takes no props — it is a pure presentational component.
 * The "property" is therefore: for ANY render of the component (no varying
 * inputs), all three elements are co-present. We express this with
 * `fc.constant(undefined)` as the generator so fast-check still manages
 * the run loop and shrinking infrastructure consistently with other PBTs.
 *
 * Validates: Requirements 4.1
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import * as fc from "fast-check";
import "@testing-library/jest-dom";

fc.configureGlobal({ numRuns: 100 });

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

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

// Mock next/navigation — CartEmptyState calls useRouter internally
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
// Helper: render CartEmptyState and assert all three required elements
// ---------------------------------------------------------------------------

async function renderEmptyState(): Promise<ReturnType<typeof render>> {
  const { default: CartEmptyState } = await import(
    "@/app/(main)/cart/_components/CartEmptyState"
  );
  return render(<CartEmptyState />);
}

function assertAllThreeElementsPresent(container: HTMLElement): void {
  // 1. SVG graphic element — the shopping-cart icon rendered by CartEmptyState
  //    It is the first <svg> inside the component (aria-hidden="true").
  const svgElements = container.querySelectorAll("svg");
  expect(svgElements.length).toBeGreaterThanOrEqual(1);

  // 2. "Your cart is empty" text
  expect(
    screen.getByText("Your cart is empty")
  ).toBeInTheDocument();

  // 3. "Browse Courses" button / link
  expect(
    screen.getByRole("link", { name: /browse courses/i })
  ).toBeInTheDocument();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 6: Empty state shows all three required elements simultaneously", () => {
  afterEach(() => {
    cleanup();
  });

  // -- Concrete unit example ------------------------------------------------

  it("renders all three elements simultaneously on a single render", async () => {
    const { container } = await renderEmptyState();
    assertAllThreeElementsPresent(container);
  });

  // -- Property-based test --------------------------------------------------

  it(
    "[property] all three elements are co-present in the DOM for any render of CartEmptyState — Validates: Requirements 4.1",
    async () => {
      await fc.assert(
        // CartEmptyState takes no props; fc.constant(undefined) drives the run loop
        fc.asyncProperty(fc.constant(undefined), async () => {
          const { default: CartEmptyState } = await import(
            "@/app/(main)/cart/_components/CartEmptyState"
          );
          const { container, unmount } = render(<CartEmptyState />);

          try {
            // 1. SVG graphic (non-text graphic element — Req 4.1)
            const svgElements = container.querySelectorAll("svg");
            expect(svgElements.length).toBeGreaterThanOrEqual(1);

            // 2. "Your cart is empty" text (Req 4.1)
            expect(
              screen.getByText("Your cart is empty")
            ).toBeInTheDocument();

            // 3. "Browse Courses" CTA (Req 4.1)
            expect(
              screen.getByRole("link", { name: /browse courses/i })
            ).toBeInTheDocument();
          } finally {
            unmount();
          }
        })
      );
    }
  );
});
