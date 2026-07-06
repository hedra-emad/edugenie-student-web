/**
 * @vitest-environment jsdom
 *
 * Unit tests for CartPageClient
 * Requirements: 1.6, 3.3, 4.4, 5.4, 9.2, 9.3
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";

import CartPageClient from "../CartPageClient";
import { CartProvider } from "@/contexts/CartContext";
import type { Cart, CartItem } from "@/types/checkout";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock next/image
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

// Mock next/link — render as plain <a>
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// Mock checkout API
const mockGetCart = vi.fn();
const mockRemoveFromCart = vi.fn();
const mockInitiateCheckout = vi.fn();
const mockInitiateStripeCartCheckout = vi.fn();
vi.mock("@/lib/api/checkout", () => ({
  getCart: (...args: unknown[]) => mockGetCart(...args),
  removeFromCart: (...args: unknown[]) => mockRemoveFromCart(...args),
  initiateCheckout: (...args: unknown[]) => mockInitiateCheckout(...args),
  initiateStripeCartCheckout: (...args: unknown[]) =>
    mockInitiateStripeCartCheckout(...args),
}));

// Mock coupon API
vi.mock("@/lib/api/coupon", () => ({
  validateCoupon: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderWithProvider(ui: React.ReactElement) {
  return render(<CartProvider>{ui}</CartProvider>);
}

const sampleItem: CartItem = {
  _id: "item-1",
  type: "full_course",
  courseId: "course-abc",
  courseTitle: "React Fundamentals",
  instructorName: "Jane Doe",
  thumbnail: "",
  price: 49,
};

const sampleCart: Cart = {
  items: [sampleItem],
  subtotal: 49,
  total: 49,
};

// ---------------------------------------------------------------------------
// Test 1 — "Try Again" triggers exactly one re-fetch; after second failure
//          the "Try Again" button disappears (retryCount becomes 1).
//          Requirement 9.3
// ---------------------------------------------------------------------------

describe('CartPageClient — "Try Again" retry behaviour (Req 9.3)', () => {
  beforeEach(() => {
    mockGetCart.mockReset();
    mockRemoveFromCart.mockReset();
    mockRouterPush.mockReset();
  });

  it('shows "Try Again" when initialCart is null (retryCount = 0)', () => {
    renderWithProvider(<CartPageClient initialCart={null} />);

    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it('clicking "Try Again" once (getCart returns null) hides the button and shows network error', async () => {
    mockGetCart.mockResolvedValue(null);

    renderWithProvider(<CartPageClient initialCart={null} />);

    const btn = screen.getByRole("button", { name: /try again/i });
    await act(async () => {
      fireEvent.click(btn);
    });

    // getCart should have been called exactly once
    expect(mockGetCart).toHaveBeenCalledTimes(1);

    // After the retry completes, the "Try Again" button must be gone
    // (retryCount is now 1, so the {retryCount < 1 && <button>} branch is false)
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();

    // Error message still present — network error keeps the error UI
    expect(
      screen.getByText(/something went wrong while loading your cart/i)
    ).toBeInTheDocument();
  });

  it('does NOT call getCart a second time after retryCount reaches 1', async () => {
    mockGetCart.mockResolvedValue(null);

    renderWithProvider(<CartPageClient initialCart={null} />);

    // First click
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    });

    // Button no longer exists — a second click cannot happen
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();

    // getCart was called exactly once
    expect(mockGetCart).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Auth error path: session-expired message includes a link to /login.
//          Network error path: /login link is absent in network error state.
//          Requirements 1.6, 9.2
// ---------------------------------------------------------------------------

describe("CartPageClient — auth error state (Req 1.6, 9.2)", () => {
  it("session-expired state renders a link with href='/login'", () => {
    // Seed fetchError = "auth" via the test-only prop
    renderWithProvider(
      <CartPageClient initialCart={null} __testFetchError="auth" />
    );

    // Must show the session-expired message (not the generic network message)
    expect(
      screen.getByText(/your session may have expired/i)
    ).toBeInTheDocument();

    // A link pointing to /login must be in the DOM
    const loginLink = screen.getByRole("link", { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("auth error state does NOT show the generic 'Something went wrong' message", () => {
    renderWithProvider(
      <CartPageClient initialCart={null} __testFetchError="auth" />
    );

    expect(
      screen.queryByText(/something went wrong while loading your cart/i)
    ).not.toBeInTheDocument();
  });

  it("auth error state does NOT show the 'Try Again' button", () => {
    renderWithProvider(
      <CartPageClient initialCart={null} __testFetchError="auth" />
    );

    // Session-expired errors should not offer a retry — user must log in
    expect(
      screen.queryByRole("button", { name: /try again/i })
    ).not.toBeInTheDocument();
  });
});

describe("CartPageClient — network error UI (Req 9.2)", () => {
  it("renders the network error message when initialCart is null", () => {
    renderWithProvider(<CartPageClient initialCart={null} />);

    expect(
      screen.getByText(/something went wrong while loading your cart/i)
    ).toBeInTheDocument();
  });

  it("network error state does NOT show the /login link", () => {
    renderWithProvider(<CartPageClient initialCart={null} />);

    // In network error state there is no session-expired /login link
    const loginLinks = screen.queryAllByRole("link", { name: /log in/i });
    const loginHrefs = loginLinks.filter(
      (el) => el.getAttribute("href") === "/login"
    );
    expect(loginHrefs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Test 3 — A failed paid-cart Stripe checkout shows the backend error inline
//          and does not navigate. (Whole-cart Stripe checkout error path.)
// ---------------------------------------------------------------------------

describe("CartPageClient — paid checkout failure shows inline error", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockInitiateStripeCartCheckout.mockReset();
  });

  it("surfaces the backend message and does not navigate", async () => {
    mockInitiateStripeCartCheckout.mockRejectedValueOnce(
      new Error("The instructor has not set up Stripe payouts yet."),
    );

    const paidCart: Cart = {
      items: [sampleItem],
      subtotal: 49,
      total: 49,
    };

    renderWithProvider(<CartPageClient initialCart={paidCart} />);

    const checkoutBtn = screen.getByRole("button", {
      name: /proceed to checkout/i,
    });
    fireEvent.click(checkoutBtn);

    // Backend error surfaces inline; no client-side navigation.
    expect(
      await screen.findByText(/instructor has not set up stripe payouts/i),
    ).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Test 4 — Cancel confirmation restores item without calling removeFromCart.
//          Requirement 3.3
// ---------------------------------------------------------------------------

describe("CartPageClient — cancel confirmation does not remove item (Req 3.3)", () => {
  beforeEach(() => {
    mockRemoveFromCart.mockReset();
  });

  it("item remains in DOM and removeFromCart is NOT called after clicking Cancel", async () => {
    renderWithProvider(<CartPageClient initialCart={sampleCart} />);

    // The remove button for the item must be visible initially
    const removeBtn = screen.getByRole("button", {
      name: /remove react fundamentals/i,
    });
    expect(removeBtn).toBeInTheDocument();

    // Click the trash/remove button to open confirm modal
    fireEvent.click(removeBtn);

    // ConfirmRemoveModal should appear
    expect(screen.getByText("Remove?")).toBeInTheDocument();

    // Click Cancel
    const cancelBtn = screen.getByRole("button", {
      name: /cancel removing react fundamentals/i,
    });
    fireEvent.click(cancelBtn);

    // Modal should be gone
    expect(screen.queryByText("Remove?")).not.toBeInTheDocument();

    // Remove button is still in the DOM (item was not removed)
    expect(
      screen.getByRole("button", { name: /remove react fundamentals/i })
    ).toBeInTheDocument();

    // removeFromCart was never called
    expect(mockRemoveFromCart).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Test 5 — Empty state is NOT shown while loading (isLoading = true).
//          After clicking "Try Again" the skeleton is shown, not CartEmptyState.
//          Requirement 4.4
// ---------------------------------------------------------------------------

describe("CartPageClient — empty state absent during loading (Req 4.4)", () => {
  it("shows CartSkeleton and NOT CartEmptyState while getCart is in flight", async () => {
    // getCart never resolves during this test — simulates loading state
    mockGetCart.mockImplementation(
      () => new Promise<null>(() => { /* intentionally never resolves */ })
    );

    renderWithProvider(<CartPageClient initialCart={null} />);

    // Trigger the loading state by clicking "Try Again"
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    });

    // CartSkeleton should be present (has role="status" with aria-busy)
    const skeleton = screen.getByRole("status");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-busy", "true");

    // "Your cart is empty" must NOT appear while loading
    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();
  });
});
