// @vitest-environment jsdom
// Feature: cart-page, Property 14: Header badge reflects any cart item count correctly

/**
 * Property 14: Header badge reflects any cart item count correctly (component level)
 *
 * Renders <Header> with mocked CartContext providing arbitrary cartCount values.
 * Asserts badge text and presence match the count rules:
 *   - count === null || count === 0  → no badge element in the DOM
 *   - 1 ≤ count ≤ 99               → badge text is exact count string
 *   - count > 99                    → badge text is "99+"
 *
 * Validates: Requirements 7.2, 7.3, 7.4
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as fc from "fast-check";
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ enabled }: { enabled?: boolean }) => {
    if (!enabled) {
      return { data: undefined };
    }
    const count = (globalThis as { __mockCartCount?: number }).__mockCartCount;
    return {
      data:
        count !== undefined
          ? { items: Array(count).fill({}) }
          : undefined,
    };
  },
}));

import { SessionProvider } from "@/providers/SessionProvider";

import "@testing-library/jest-dom";

fc.configureGlobal({ numRuns: 100 });

// ---------------------------------------------------------------------------
// Module mocks — must be at module scope
// ---------------------------------------------------------------------------

// Mock next/link to render a plain <a> so jsdom doesn't choke on Next.js internals
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

// Mock next/image to render a plain <img>
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    ...rest
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} {...rest} />
  ),
}));

// ---------------------------------------------------------------------------
// Helper: render <Header> inside a CartContext.Provider with given cartCount
// ---------------------------------------------------------------------------

// Import Header lazily inside a factory to ensure mocks are applied first
async function renderHeaderWithCount(
  cartCount: number | null
): Promise<ReturnType<typeof render>> {
  const { default: Header } = await import("@/components/layout/Header");

  (globalThis as { __mockCartCount?: number }).__mockCartCount =
    cartCount === null ? undefined : cartCount;

  return render(
    <SessionProvider isAuthenticated={cartCount !== null}>
      <Header isStudent={true} displayName={null} />
    </SessionProvider>
  );
}

// ---------------------------------------------------------------------------
// Helper: find badge element(s) in the rendered output.
// The badge is a <span aria-hidden="true"> with absolute positioning inside
// a <Link href="/cart">. We identify it by its role-less content (since
// aria-hidden removes it from the accessible tree) using querySelectorAll.
// ---------------------------------------------------------------------------
function getBadgeElements(container: HTMLElement): HTMLElement[] {
  // The badge span sits inside <a href="/cart"> and has a very specific
  // class that includes "rounded-full bg-red-500". We select all spans
  // inside the cart link(s) and filter by aria-hidden="true".
  const cartLinks = container.querySelectorAll('a[href="/cart"]');
  const badges: HTMLElement[] = [];
  cartLinks.forEach((link) => {
    const spans = link.querySelectorAll("span[aria-hidden='true']");
    spans.forEach((s) => badges.push(s as HTMLElement));
  });
  return badges;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 14: Header badge reflects any cart item count correctly (component level)", () => {
  // -- Concrete unit examples ------------------------------------------------

  it("renders no badge when cartCount is null", async () => {
    const { container } = await renderHeaderWithCount(null);
    expect(getBadgeElements(container)).toHaveLength(0);
  });

  it("renders no badge when cartCount is 0", async () => {
    const { container } = await renderHeaderWithCount(0);
    expect(getBadgeElements(container)).toHaveLength(0);
  });

  it("renders badge with '5' when cartCount is 5", async () => {
    const { container } = await renderHeaderWithCount(5);
    const badges = getBadgeElements(container);
    // At least one badge visible (desktop nav has one, mobile panel has one)
    expect(badges.length).toBeGreaterThanOrEqual(1);
    badges.forEach((b) => expect(b).toHaveTextContent("5"));
  });

  it("renders badge with '99' when cartCount is 99", async () => {
    const { container } = await renderHeaderWithCount(99);
    const badges = getBadgeElements(container);
    expect(badges.length).toBeGreaterThanOrEqual(1);
    badges.forEach((b) => expect(b).toHaveTextContent("99"));
  });

  it("renders badge with '99+' when cartCount is 100", async () => {
    const { container } = await renderHeaderWithCount(100);
    const badges = getBadgeElements(container);
    expect(badges.length).toBeGreaterThanOrEqual(1);
    badges.forEach((b) => expect(b).toHaveTextContent("99+"));
  });

  // -- Property-based tests --------------------------------------------------

  it(
    "[property] no badge element when cartCount is 0 — Validates: Requirements 7.3, 7.4",
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(0), async (n) => {
          const { container, unmount } = await renderHeaderWithCount(n);
          try {
            const badges = getBadgeElements(container);
            expect(badges).toHaveLength(0);
          } finally {
            unmount();
          }
        })
      );
    }
  );

  it(
    "[property] badge shows exact count for 1 ≤ cartCount ≤ 99 — Validates: Requirements 7.2, 7.3",
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 99 }), async (n) => {
          const { container, unmount } = await renderHeaderWithCount(n);
          try {
            const badges = getBadgeElements(container);
            // At least one badge must be present (desktop nav renders one)
            expect(badges.length).toBeGreaterThanOrEqual(1);
            // Every badge that appears must show the exact count
            badges.forEach((badge) => {
              expect(badge).toHaveTextContent(String(n));
            });
          } finally {
            unmount();
          }
        })
      );
    }
  );

  it(
    "[property] badge shows '99+' for cartCount > 99 — Validates: Requirements 7.2",
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 100, max: 10_000 }), async (n) => {
          const { container, unmount } = await renderHeaderWithCount(n);
          try {
            const badges = getBadgeElements(container);
            expect(badges.length).toBeGreaterThanOrEqual(1);
            badges.forEach((badge) => {
              expect(badge).toHaveTextContent("99+");
            });
          } finally {
            unmount();
          }
        })
      );
    }
  );

  it(
    "[property] badge absence or text is correct for all non-negative integers — Validates: Requirements 7.2, 7.3, 7.4",
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.nat({ max: 10_000 }), async (n) => {
          const { container, unmount } = await renderHeaderWithCount(n);
          try {
            const badges = getBadgeElements(container);

            if (n === 0) {
              // Requirement 7.3: zero items → no badge
              expect(badges).toHaveLength(0);
            } else if (n <= 99) {
              // Requirement 7.2: 1–99 → exact count
              expect(badges.length).toBeGreaterThanOrEqual(1);
              badges.forEach((b) => expect(b).toHaveTextContent(String(n)));
            } else {
              // Requirement 7.2: > 99 → "99+"
              expect(badges.length).toBeGreaterThanOrEqual(1);
              badges.forEach((b) => expect(b).toHaveTextContent("99+"));
            }
          } finally {
            unmount();
          }
        })
      );
    }
  );
});
