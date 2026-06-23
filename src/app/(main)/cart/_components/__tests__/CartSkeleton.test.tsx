/**
 * @vitest-environment jsdom
 *
 * Unit tests for CartSkeleton
 * Requirements: 1.3, 4.4
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";

import CartSkeleton from "../CartSkeleton";

describe("CartSkeleton — placeholder structure", () => {
  it("renders a status container with aria-busy='true'", () => {
    render(<CartSkeleton />);

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-busy", "true");
  });

  it("renders thumbnail rect placeholders (w-20 h-14)", () => {
    const { container } = render(<CartSkeleton />);

    // Each item card has a thumbnail rect with these Tailwind classes
    const thumbnails = container.querySelectorAll(".w-20.h-14");
    expect(thumbnails.length).toBeGreaterThanOrEqual(1);
  });

  it("renders title rect placeholders (h-4 rounded)", () => {
    const { container } = render(<CartSkeleton />);

    // Title rects are h-4 bg-slate-200 rounded w-3/4
    const titleRects = container.querySelectorAll(".h-4.bg-slate-200.rounded");
    expect(titleRects.length).toBeGreaterThanOrEqual(1);
  });

  it("renders price rect placeholders (h-5 w-16)", () => {
    const { container } = render(<CartSkeleton />);

    // Price rects are h-5 w-16 bg-slate-200 rounded
    const priceRects = container.querySelectorAll(".h-5.w-16.bg-slate-200.rounded");
    expect(priceRects.length).toBeGreaterThanOrEqual(1);
  });

  it("renders animate-pulse shimmer elements", () => {
    const { container } = render(<CartSkeleton />);

    const pulseElements = container.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThanOrEqual(1);
  });
});

describe("CartSkeleton — empty state NOT rendered (Req 4.4)", () => {
  it("does NOT render 'Your cart is empty' text", () => {
    render(<CartSkeleton />);

    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();
  });

  it("does NOT render a 'Browse Courses' button", () => {
    render(<CartSkeleton />);

    expect(
      screen.queryByRole("link", { name: /browse courses/i })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /browse courses/i })
    ).not.toBeInTheDocument();
  });
});
