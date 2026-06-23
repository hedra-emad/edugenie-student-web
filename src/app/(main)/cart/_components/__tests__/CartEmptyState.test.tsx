/**
 * @vitest-environment jsdom
 *
 * Unit tests for CartEmptyState
 * Requirements: 4.1, 4.2
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";

import CartEmptyState from "../CartEmptyState";

// ---------------------------------------------------------------------------
// Mock next/link — render as plain <a> so href is inspectable
// ---------------------------------------------------------------------------
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    [key: string]: unknown;
  }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Mock next/navigation — provide a controllable router.push spy
// ---------------------------------------------------------------------------
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CartEmptyState — simultaneous element presence", () => {
  it("renders the SVG graphic, the empty-state text, and the Browse Courses button all at once", () => {
    render(<CartEmptyState />);

    // SVG graphic — aria-hidden="true" on the cart icon SVG
    const svgEl = document.querySelector("svg[aria-hidden='true']");
    expect(svgEl).toBeInTheDocument();

    // "Your cart is empty" text
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();

    // "Browse Courses" link/button
    expect(
      screen.getByRole("link", { name: /browse courses/i })
    ).toBeInTheDocument();
  });
});

describe("CartEmptyState — Browse Courses navigation", () => {
  it("clicking 'Browse Courses' calls router.push('/courses')", () => {
    mockPush.mockClear();

    render(<CartEmptyState />);

    const browseLink = screen.getByRole("link", { name: /browse courses/i });
    fireEvent.click(browseLink);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/courses");
  });
});
