/**
 * @vitest-environment jsdom
 *
 * Unit tests for Header cart icon
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import "@testing-library/jest-dom";

import { CartContext, CartContextValue } from "@/contexts/CartContext";
import Header from "../Header";

// ---------------------------------------------------------------------------
// Mock next/link so it renders a plain <a> we can inspect
// ---------------------------------------------------------------------------
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Mock next/image so it renders a plain <img>
// ---------------------------------------------------------------------------
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    ...rest
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} width={width} height={height} {...rest} />,
}));

// ---------------------------------------------------------------------------
// Helper: render Header wrapped in CartContext.Provider
// ---------------------------------------------------------------------------
function renderHeader(cartCount: number | null) {
  const value: CartContextValue = { cartCount, setCartCount: () => {} };
  return render(
    <CartContext.Provider value={value}>
      <Header isStudent={true} displayName={null} />
    </CartContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Helper: open the mobile menu
// ---------------------------------------------------------------------------
function openMobileMenu() {
  const toggleBtn = screen.getByRole("button", { name: /toggle menu/i });
  fireEvent.click(toggleBtn);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Header — cart icon links", () => {
  it("desktop nav contains a <Link> with href='/cart'", () => {
    renderHeader(null);

    // All cart links rendered — at least one is present
    const cartLinks = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href") === "/cart");

    expect(cartLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("mobile menu panel contains a <Link> with href='/cart'", () => {
    renderHeader(null);
    openMobileMenu();

    // After opening the mobile menu there should still be cart links
    const cartLinks = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href") === "/cart");

    // Desktop (hidden via CSS) + mobile = at least 2 in DOM
    expect(cartLinks.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Header — cart icon badge: no badge cases", () => {
  it("cartCount = null → no badge element in DOM", () => {
    renderHeader(null);

    // Badge is a <span aria-hidden="true"> with numeric text.
    // The cart Link's aria-label is "Cart" when no badge.
    const badgeSpans = document
      .querySelectorAll('a[href="/cart"] span[aria-hidden="true"]');

    expect(badgeSpans.length).toBe(0);
  });

  it("cartCount = 0 → no badge element in DOM", () => {
    renderHeader(0);

    const badgeSpans = document
      .querySelectorAll('a[href="/cart"] span[aria-hidden="true"]');

    expect(badgeSpans.length).toBe(0);
  });
});

describe("Header — cart icon badge: badge visible cases", () => {
  it("cartCount = 5 → badge shows '5'", () => {
    renderHeader(5);

    // aria-label on the link reflects count
    const cartLink = screen.getByRole("link", { name: /cart, 5 items/i });
    expect(cartLink).toBeInTheDocument();

    // Badge span text
    const badgeSpan = cartLink.querySelector('span[aria-hidden="true"]');
    expect(badgeSpan).toBeInTheDocument();
    expect(badgeSpan?.textContent).toBe("5");
  });

  it("cartCount = 100 → badge shows '99+'", () => {
    renderHeader(100);

    // aria-label caps at "99+ items"
    const cartLink = screen.getByRole("link", { name: /cart, 99\+ items/i });
    expect(cartLink).toBeInTheDocument();

    const badgeSpan = cartLink.querySelector('span[aria-hidden="true"]');
    expect(badgeSpan).toBeInTheDocument();
    expect(badgeSpan?.textContent).toBe("99+");
  });
});
