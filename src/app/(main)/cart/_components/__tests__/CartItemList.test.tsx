/**
 * @vitest-environment jsdom
 *
 * Unit tests for CartItemList
 * Requirements: 3.1, 3.3, 3.6
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";

import CartItemList from "../CartItemList";
import type { CartItem } from "@/types/checkout";
import {
  getCartItemRemoveId,
  groupCartItemsByCourse,
  getOrderedCourseIds,
} from "../cartItemUtils";

// ---------------------------------------------------------------------------
// Mock next/image — render as plain <img> so it works in jsdom
// ---------------------------------------------------------------------------
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    sizes: _sizes,
    className,
    onError,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    className?: string;
    onError?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={onError} />
  ),
}));

// ---------------------------------------------------------------------------
// Shared sample data
// ---------------------------------------------------------------------------

const item: CartItem = {
  _id: "item-1",
  type: "full_course",
  courseId: "course-1",
  courseTitle: "React Basics",
  instructorName: "John Doe",
  thumbnail: "",
  price: 49,
};

// ---------------------------------------------------------------------------
// Default prop factories
// ---------------------------------------------------------------------------

function defaultProps(overrides: Partial<React.ComponentProps<typeof CartItemList>> = {}) {
  const sampleItems = [item];
  const groupedItems =
    overrides.groupedItems ?? groupCartItemsByCourse(sampleItems);
  const orderedCourseIds =
    overrides.orderedCourseIds ?? getOrderedCourseIds(sampleItems);

  return {
    groupedItems,
    orderedCourseIds,
    removingIds: new Set<string>(),
    errorIds: new Map<string, string>(),
    onRequestRemove: vi.fn(),
    onDismissError: vi.fn(),
    getRemoveId: getCartItemRemoveId,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CartItemList — remove button click opens ConfirmRemoveModal", () => {
  it("clicking the remove button shows the inline confirm modal before any API call", () => {
    const onRequestRemove = vi.fn();
    render(<CartItemList {...defaultProps({ onRequestRemove })} />);

    // Confirm modal should NOT be visible initially
    expect(screen.queryByText("Remove?")).not.toBeInTheDocument();

    // Click the remove (trash) button
    const removeBtn = screen.getByRole("button", {
      name: /remove react basics/i,
    });
    fireEvent.click(removeBtn);

    // ConfirmRemoveModal text must now appear
    expect(screen.getByText("Remove?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm remove react basics/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancel removing react basics/i })
    ).toBeInTheDocument();

    // onRequestRemove must NOT have been called yet
    expect(onRequestRemove).not.toHaveBeenCalled();
  });
});

describe("CartItemList — cancel on ConfirmRemoveModal hides modal without removing", () => {
  it("pressing Cancel closes the modal and does not call onRequestRemove", () => {
    const onRequestRemove = vi.fn();
    render(<CartItemList {...defaultProps({ onRequestRemove })} />);

    // Open the modal
    fireEvent.click(screen.getByRole("button", { name: /remove react basics/i }));
    expect(screen.getByText("Remove?")).toBeInTheDocument();

    // Click Cancel
    fireEvent.click(
      screen.getByRole("button", { name: /cancel removing react basics/i })
    );

    // Modal should be gone
    expect(screen.queryByText("Remove?")).not.toBeInTheDocument();

    // onRequestRemove must still not have been called
    expect(onRequestRemove).not.toHaveBeenCalled();
  });
});

describe("CartItemList — dismiss error button", () => {
  it("clicking × calls onDismissError with the item id and removes the inline error", () => {
    const onDismissError = vi.fn();
    const errorIds = new Map([["course-1", "Failed to remove item"]]);
    render(
      <CartItemList {...defaultProps({ errorIds, onDismissError })} />
    );

    // Error message should be visible
    expect(screen.getByText("Failed to remove item")).toBeInTheDocument();

    // Click the dismiss (×) button
    const dismissBtn = screen.getByRole("button", { name: /dismiss error/i });
    fireEvent.click(dismissBtn);

    // onDismissError must be called with the item's id
    expect(onDismissError).toHaveBeenCalledTimes(1);
    expect(onDismissError).toHaveBeenCalledWith("course-1");
  });
});

describe("CartItemList — item in removingIds shows spinner and disables button", () => {
  it("remove button is disabled and contains an animate-spin SVG when item is in removingIds", () => {
    render(
      <CartItemList
        {...defaultProps({ removingIds: new Set(["course-1"]) })}
      />
    );

    // The remove button should be disabled
    const removeBtn = screen.getByRole("button", {
      name: /remove react basics/i,
    });
    expect(removeBtn).toBeDisabled();

    // The button should contain an SVG with the animate-spin class (spinner)
    const spinnerSvg = removeBtn.querySelector("svg.animate-spin");
    expect(spinnerSvg).toBeInTheDocument();
  });
});
