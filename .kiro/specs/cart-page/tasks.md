# Implementation Plan: Cart Page

## Overview

Implement the dedicated `/cart` route for the EduGenie student web application. The work breaks into five logical phases: (1) foundational types and API helpers, (2) the CartContext and Header badge, (3) the cart page route, components, and state machine, (4) unit and property-based tests, and (5) final integration wiring. Every step builds directly on the previous one so there is no orphaned code at any stage.

---

## Tasks

- [x] 1. Install dependencies and create foundational types

  - Run `npm install --save-dev fast-check` to add the property-based testing library
  - Create `src/types/coupon.ts` with `CouponValidationRequest` and `CouponValidationResponse` interfaces as specified in the design
  - Verify the existing `CartItem` and `Cart` types in `src/types/checkout.ts` — no changes required
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Implement the coupon API helper

  - [x] 2.1 Create `src/lib/api/coupon.ts` with `validateCoupon(code: string): Promise<CouponValidationResponse | null>`
    - `POST /api/proxy/coupon/validate` with body `{ code }`
    - Return `null` on network errors or 5xx responses
    - Return `CouponValidationResponse` (with `valid: false`) for 4xx semantic rejections
    - Follow the same `baseUrl()` pattern used in `src/lib/api/checkout.ts`
    - _Requirements: 6.2, 6.4, 6.6_

  - [x] 2.2 Write unit tests for `validateCoupon`
    - Test: network error → returns `null`
    - Test: 5xx response → returns `null`
    - Test: 4xx with error body → returns `CouponValidationResponse` with `valid: false`
    - Test: 200 with valid coupon body → returns populated `CouponValidationResponse`
    - _Requirements: 6.2, 6.4, 6.6_

- [x] 3. Implement CartContext and update RootLayout

  - [x] 3.1 Create `src/contexts/CartContext.tsx` with `CartContextValue`, `CartContext`, and `CartProvider`
    - `cartCount: number | null` initialises to `null`
    - `setCartCount: (n: number | null) => void` exposed via context
    - Export `useCartContext` convenience hook that throws if used outside provider
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [x] 3.2 Wrap `SiteShell` with `CartProvider` in `src/app/layout.tsx`
    - Insert `<CartProvider>` inside `<QueryProvider>`, wrapping `<SiteShell>`
    - No other changes to `layout.tsx`
    - _Requirements: 7.1, 7.5_

  - [x] 3.3 Write property test for CartContext badge count display rules (Property 14)
    - **Property 14: Header badge reflects any cart item count correctly**
    - Generator: arbitrary non-negative integer `n`
    - Assert: `n === 0` → badge absent; `1 ≤ n ≤ 99` → badge shows exact `n`; `n > 99` → badge shows `"99+"`
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [x] 4. Update the Header component with cart icon and badge

  - [x] 4.1 Modify `src/components/layout/Header.tsx` to read `cartCount` from `CartContext` and render the cart icon
    - Import `useCartContext` from `src/contexts/CartContext.tsx`
    - Add a `<Link href="/cart">` cart icon to the desktop nav row (right of nav links, left of auth controls)
    - Add the same `<Link href="/cart">` cart icon inside the mobile hamburger panel
    - Render the badge element when `cartCount >= 1`: show exact count for `1–99`, `"99+"` for `> 99`
    - Do not render a badge when `cartCount` is `0` or `null`
    - Badge must have `aria-label` for accessibility (e.g., `"Cart, N items"`)
    - Touch targets must be at least 44 × 44 px on mobile
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

  - [x] 4.2 Write property test for cart icon badge display (Property 14 — component level)
    - **Property 14: Header badge reflects any cart item count correctly**
    - Render `<Header>` with mocked `CartContext` providing arbitrary `cartCount`
    - Assert badge text and presence match the count rules
    - **Validates: Requirements 7.2, 7.3, 7.4**

  - [x] 4.3 Write unit tests for Header cart icon
    - Test: cart icon renders a `<Link>` with `href="/cart"` in desktop nav
    - Test: cart icon renders a `<Link>` with `href="/cart"` in mobile menu panel
    - Test: `cartCount = null` → no badge element in DOM
    - Test: `cartCount = 0` → no badge element in DOM
    - Test: `cartCount = 5` → badge shows `"5"`
    - Test: `cartCount = 100` → badge shows `"99+"`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

- [x] 5. Implement shared cart page component primitives

  - [x] 5.1 Create `src/app/(main)/cart/_components/CartSkeleton.tsx`
    - Render shimmer placeholder elements: at minimum one thumbnail rect, one title rect, one price rect
    - Render a right-column order summary panel placeholder with shimmer animation
    - Must NOT render the `CartEmptyState` or any real item content
    - Export as default; can be used in both `loading.tsx` and within `CartPageClient`
    - _Requirements: 1.3_

  - [x] 5.2 Write unit tests for `CartSkeleton`
    - Test: renders placeholder elements (thumbnail rect, title rect, price rect are present)
    - Test: does NOT render "Your cart is empty" text
    - Test: does NOT render "Browse Courses" button
    - _Requirements: 1.3, 4.4_

  - [x] 5.3 Create `src/app/(main)/cart/_components/CartEmptyState.tsx`
    - Render the shopping-cart SVG icon (non-text graphic element)
    - Render the text "Your cart is empty"
    - Render a `<Link href="/courses">` "Browse Courses" button using `router.push('/courses')` on click
    - All three elements must be simultaneously present in the viewport
    - _Requirements: 4.1, 4.2_

  - [x] 5.4 Write property test for empty state simultaneous element presence (Property 6)
    - **Property 6: Empty state shows all three required elements simultaneously**
    - For any render of `CartEmptyState`, assert the SVG graphic, the text "Your cart is empty", and the "Browse Courses" button are all present in the DOM at the same time
    - **Validates: Requirements 4.1**

  - [x] 5.5 Write unit tests for `CartEmptyState`
    - Test: "Browse Courses" click calls `router.push('/courses')`
    - Test: all three elements are visible simultaneously in a single render
    - _Requirements: 4.1, 4.2_

  - [x] 5.6 Create `src/app/(main)/cart/_components/ConfirmRemoveModal.tsx`
    - Props: `itemTitle: string`, `onConfirm: () => void`, `onCancel: () => void`
    - Inline (not a portal) confirm/cancel UI rendered within item card
    - Match the inline confirm pattern established in the existing `CartSummary` component
    - _Requirements: 3.1, 3.3_

- [x] 6. Implement CartItemList component

  - [x] 6.1 Create `src/app/(main)/cart/_components/CartItemList.tsx`
    - Props interface: `items`, `removingIds: Set<string>`, `errorIds: Map<string, string>`, `onRequestRemove`, `onDismissError`
    - Render `full_course` items: thumbnail (`getSafeImageSrc` pattern from existing `CartSummary`), course title, instructor name, "Full Course" badge, price, remove button
    - Render `section` items: grouped by `courseId`; course thumbnail and title rendered once per group; section rows in order with section title and price
    - Use `ConfirmRemoveModal` for inline confirm/cancel interaction
    - Spinner on remove button while item `_id` is in `removingIds`
    - Inline error message per item when `_id` is in `errorIds`, with dismiss button calling `onDismissError`
    - Fallback placeholder image when thumbnail is missing or fails to load
    - _Requirements: 2.1, 2.2, 3.1, 3.4, 3.5, 3.6_

  - [x] 6.2 Write property test for full-course card required fields (Property 2)
    - **Property 2: Full-course card renders all required fields**
    - Generator: arbitrary `CartItem` with `type = "full_course"`, arbitrary `courseTitle`, `instructorName`, `price`
    - Assert all four fields (title, instructor, "Full Course" badge, price) are present in rendered output
    - **Validates: Requirements 2.1**

  - [x] 6.3 Write property test for section item grouping (Property 3)
    - **Property 3: Section items are grouped by courseId**
    - Generator: arbitrary array of `CartItem` objects with `type = "section"` and varying `courseId` values
    - Assert each unique `courseId` group renders its thumbnail and course title exactly once
    - **Validates: Requirements 2.2**

  - [x] 6.4 Write unit tests for `CartItemList`
    - Test: remove button click opens `ConfirmRemoveModal` before any API call
    - Test: cancel on `ConfirmRemoveModal` restores item without calling `removeFromCart`
    - Test: dismiss error button calls `onDismissError` and removes inline error message
    - Test: item in `removingIds` shows spinner and disables remove button
    - _Requirements: 3.1, 3.3, 3.6_

- [x] 7. Implement CartOrderSummary component

  - [x] 7.1 Create `src/app/(main)/cart/_components/CartOrderSummary.tsx`
    - Props: `items`, `subtotal`, `total`, `couponState: CouponState`, `onApplyCoupon`, `onRemoveCoupon`, `onCheckout`
    - Render line-item breakdown (full courses, grouped sections), subtotal row
    - Discount row: shown only when `couponState.status === "applied"` and `discountAmount > 0`
    - Total row: always shown, reflects updated total after coupon
    - "Have a coupon?" toggle reveals text input and "Apply" button
    - When `couponState.status === "applied"`, hide the input and show "Remove" button instead of "Apply"
    - "Proceed to Checkout" button: enabled when `items.length > 0`; disabled when empty (visually dimmed, `disabled` attribute)
    - Button label format: `"Proceed to Checkout — $X.XX"` with `total` formatted to exactly two decimal places
    - Payment method badges and security note (reuse visual pattern from existing `OrderSummary`)
    - _Requirements: 2.3, 2.4, 2.5, 5.1, 5.2, 5.5, 6.1, 6.3, 6.5, 6.7_

  - [x] 7.2 Write property test for subtotal equals sum of prices (Property 1)
    - **Property 1: Subtotal equals sum of item prices**
    - Generator: arbitrary `CartItem[]` with arbitrary numeric `price` values (non-negative)
    - Assert rendered subtotal text equals `items.reduce((s, i) => s + i.price, 0)`
    - **Validates: Requirements 2.3**

  - [x] 7.3 Write property test for checkout button label formatting (Property 9)
    - **Property 9: Checkout button label formats total to two decimal places**
    - Generator: arbitrary non-negative `number` as `Cart.total`
    - Assert button text matches `/\$\d+\.\d{2}/` and the numeric value equals the input rounded to two decimal places
    - Examples: `49` → `"$49.00"`, `49.5` → `"$49.50"`, `0` → `"$0.00"`
    - **Validates: Requirements 5.5**

  - [x] 7.4 Write property test for valid coupon rendering (Property 11)
    - **Property 11: Valid coupon renders discount breakdown and flips button**
    - Generator: arbitrary `CouponValidationResponse` with `valid = true` and `discountAmount > 0`
    - Assert labeled "Subtotal" line, labeled discount line, updated total, and "Remove" button are all present; "Apply" button is absent
    - **Validates: Requirements 6.3**

  - [x] 7.5 Write property test for invalid coupon leaves total unchanged (Property 12)
    - **Property 12: Invalid coupon leaves total unchanged**
    - Generator: arbitrary rejected coupon code + arbitrary original `Cart.total`
    - Mock `onApplyCoupon` to put `couponState` into `status: "error"`
    - Assert rendered total equals the original `Cart.total` value
    - **Validates: Requirements 6.4**

  - [x] 7.6 Write property test for applied coupon hides input (Property 13)
    - **Property 13: Applied coupon hides the coupon input field**
    - For any state where `couponState.status === "applied"`, assert coupon text `<input>` is not present in the DOM
    - **Validates: Requirements 6.7**

  - [x] 7.7 Write property test for coupon Apply gating (Property 10)
    - **Property 10: Coupon Apply is called for any non-empty code; skipped for empty**
    - Generator: strings of length 0–100
    - Assert: length ≥ 1 → `onApplyCoupon` is called; length 0 → `onApplyCoupon` is not called and a validation message is shown
    - **Validates: Requirements 6.2, 6.5**

  - [x] 7.8 Write unit tests for `CartOrderSummary`
    - Test: "Proceed to Checkout" is disabled when `items` is empty
    - Test: coupon toggle shows/hides input on click
    - Test: network error on coupon shows message distinct from invalid-code message
    - Test: subtotal and discount rows visible when valid coupon applied with `discountAmount > 0`
    - _Requirements: 5.2, 6.1, 6.3, 6.6_

- [ ] 8. Implement CartPageClient state machine

  - [x] 8.1 Create `src/app/(main)/cart/_components/CartPageClient.tsx`
    - `"use client"` component; props: `{ initialCart: Cart | null }`
    - State: `items`, `subtotal`, `total`, `fetchError: "auth" | "network" | null`, `retryCount: 0 | 1`, `couponState: CouponState`, `removingIds: Set<string>`, `errorIds: Map<string, string>`
    - Initialise all state from `initialCart`; if `initialCart` is `null`, set `fetchError` to show generic error
    - Call `setCartCount` from `CartContext` after every successful mutation (remove or coupon apply/remove)
    - Optimistic item removal: hide item immediately on confirm, call `removeFromCart`, restore on failure
    - AbortController per remove call; auto-abort at 30 s; restore item and show `"Request timed out"` error
    - "Try Again" handler: call `getCart` on the client side; set `fetchError` based on result; increment `retryCount`; if `retryCount === 1`, do not retry further
    - Coupon apply handler: call `validateCoupon`, update `couponState` based on response
    - Checkout handler: if `items[0].courseId` is empty, set inline error; otherwise `router.push('/checkout/' + items[0].courseId)`
    - Render: `CartSkeleton` during loading, `CartEmptyState` when `items.length === 0` after fetch, error UI with "Try Again" or session-expired message, two-column layout (`lg:grid-cols-[1fr_380px]`) with `CartItemList` + `CartOrderSummary`
    - _Requirements: 1.2, 1.4, 1.6, 1.7, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.3, 4.4, 5.3, 5.4, 6.2, 6.3, 6.4, 6.5, 6.6, 7.5, 8.1, 8.2, 9.1, 9.2, 9.3_

  - [ ] 8.2 Write property test for optimistic removal removes target item (Property 4)
    - **Property 4: Optimistic removal removes the target item**
    - Generator: arbitrary non-empty `CartItem[]`, random index to remove
    - Mock `removeFromCart` to return `true`
    - Assert the removed item's `_id` is absent from rendered output after confirm; test with both multi-item and single-item lists (single-item → transitions to empty state)
    - **Validates: Requirements 3.2, 3.7**

  - [x] 8.3 Write property test for failed removal restores target item (Property 5)
    - **Property 5: Failed removal restores the target item**
    - Generator: arbitrary non-empty `CartItem[]`, random index to remove
    - Mock `removeFromCart` to return `false`
    - Assert the removed item reappears in the rendered list and an inline error message is visible
    - **Validates: Requirements 3.5**

  - [x] 8.4 Write property test for checkout navigation uses first item's courseId (Property 8)
    - **Property 8: Checkout navigation uses first item's courseId**
    - Generator: arbitrary non-empty `Cart` where `items[0].courseId` is a non-empty string
    - Assert `router.push` is called with `/checkout/${items[0].courseId}`
    - **Validates: Requirements 5.3**

  - [x] 8.5 Write property test for optimistic badge update (Property 15)
    - **Property 15: Cart count badge updates immediately after add or remove**
    - Generator: arbitrary pre-mutation cart count and a remove operation
    - Assert `setCartCount` is called with the correct post-mutation count immediately (synchronously, before any API response)
    - **Validates: Requirements 7.5**

  - [ ] 8.6 Write unit tests for `CartPageClient`
    - Test: "Try Again" triggers exactly one re-fetch; second failure keeps error state without further retries
    - Test: session-expired error (`fetchError === "auth"`) includes a link to `/login`
    - Test: missing `courseId` on checkout click shows inline error without navigating
    - Test: cancel confirmation restores item without calling `removeFromCart`
    - Test: empty state is not shown while fetch is in flight (during loading)
    - _Requirements: 1.6, 3.3, 4.4, 5.4, 9.2, 9.3_

- [ ] 9. Checkpoint — core components complete

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement cart page route files

  - [x] 10.1 Create `src/app/(main)/cart/loading.tsx`
    - Re-export or render `CartSkeleton` as the Suspense boundary for the `/cart` route
    - _Requirements: 1.3_

  - [ ] 10.2 Create `src/app/(main)/cart/page.tsx` as a Next.js 15 Server Component
    - Export `metadata = { title: "Cart — EduGenie" }`
    - Read `access_token`, `token`, or `accessToken` cookie using `next/headers` cookies API (consult `node_modules/next/dist/docs/` for the current async cookies API)
    - Call `getCart(token)` — pass the token string if found, otherwise pass `undefined`
    - Render `<CartPageClient initialCart={cart} />` inside `<main className="min-h-screen bg-slate-50 py-10">`
    - Never redirect on null/empty cart; pass `null` to the client component
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7_

  - [ ] 10.3 Write unit tests for `CartPage` (server component behaviour via rendering)
    - Test: page title metadata equals `"Cart — EduGenie"`
    - Test: `CartPageClient` receives `null` when `getCart` returns `null`
    - _Requirements: 1.5, 1.6_

- [ ] 11. Wire CartPageClient into CartContext for live badge sync

  - [ ] 11.1 Confirm `CartPageClient` calls `setCartCount(items.length)` on mount (after `initialCart` is set) and after every remove or coupon operation
    - On successful remove: `setCartCount(items.length - 1)` (optimistic, before API resolves)
    - On failed remove / restore: `setCartCount(items.length)` (restore count)
    - On `CartPageClient` mount with a valid cart: `setCartCount(initialCart.items.length)`
    - On `CartPageClient` mount with `null` cart: `setCartCount(null)`
    - _Requirements: 7.5_

  - [ ] 11.2 Write property test for empty state not shown during load (Property 7)
    - **Property 7: Empty state is absent during loading**
    - Render `CartPageClient` in a pending/loading state (before `initialCart` resolves)
    - Assert `CartEmptyState` (and the text "Your cart is empty") is not present in the DOM
    - **Validates: Requirements 4.4**

- [ ] 12. Responsive layout and accessibility pass

  - [ ] 12.1 Audit `CartPageClient` and child components for responsive layout compliance
    - Verify single-column stacked layout on `< 1024 px` (items above order summary)
    - Verify two-column layout on `>= 1024 px` with sticky order summary panel
    - Verify all interactive elements (remove buttons, coupon input, checkout button) have minimum 44 × 44 px touch targets on mobile
    - Add or correct Tailwind classes as needed — no logic changes
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 12.2 Accessibility and aria attributes audit
    - Cart icon badge must have `aria-label` (e.g., `aria-label="Cart, 3 items"`)
    - Remove buttons must have `aria-label` per item (e.g., `aria-label="Remove Introduction to React"`)
    - Loading skeleton must have `role="status"` and `aria-busy="true"`
    - Confirm modal must trap focus appropriately (inline modal pattern)
    - _Requirements: 3.1, 7.1_

- [ ] 13. Final checkpoint — full feature complete

  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery; they validate correctness properties and edge cases
- Property-based tests use `fast-check` (install in Task 1) with `fc.configureGlobal({ numRuns: 100 })` at the top of each test file
- Each property test corresponds to a numbered property in the design document's "Correctness Properties" section
- The existing `CartSummary`, `OrderSummary`, `Thumbnail`, `getSafeImageSrc`, and `removeFromCart` from the checkout flow are reused directly — do not duplicate them
- The Next.js 15 `cookies()` API from `next/headers` is async; read `node_modules/next/dist/docs/` before writing `page.tsx` (see AGENTS.md)
- `fast-check` is not yet in `package.json`; Task 1 installs it as a dev dependency
- No Vitest config changes are required; `fast-check` integrates with standard test runners
- `CartContext` lives at `src/contexts/CartContext.tsx` — create the `src/contexts/` directory as part of Task 3.1

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "3.3"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1", "5.3", "5.6"] },
    { "id": 5, "tasks": ["5.2", "5.4", "5.5", "6.1", "7.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8"] },
    { "id": 7, "tasks": ["8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3", "8.4", "8.5", "8.6", "10.1"] },
    { "id": 9, "tasks": ["10.2", "11.1"] },
    { "id": 10, "tasks": ["10.3", "11.2"] },
    { "id": 11, "tasks": ["12.1", "12.2"] }
  ]
}
```
