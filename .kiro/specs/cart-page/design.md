# Design Document — Cart Page

## Overview

The Cart Page adds a dedicated `/cart` route to the EduGenie student web application. It gives
students a central place to review, manage, and act on every course and section queued for
purchase before proceeding to checkout.

Today, the "Add to Cart" action on the course detail page sends students straight to
`/checkout/[courseId]`, skipping any intermediate review step. The cart page closes that gap:
students can visit `/cart` at any time, remove unwanted items, apply coupon codes, see live
pricing, and then navigate to checkout — or continue browsing.

The feature also threads a live item-count badge into the site `Header` so students always
know how many items are pending, regardless of which page they are on.

### Key design goals

- **Reuse, don't reinvent.** The cart page is built on top of the identical `CartSummary`,
  `OrderSummary`, `Thumbnail`, and type definitions already proven in the
  `/checkout/[courseId]` flow.
- **Server-first fetch, client-side optimism.** The initial cart is loaded in a Next.js 15
  Server Component (matching the checkout page pattern); mutations (remove, coupon) are
  handled optimistically on the client.
- **Single source of truth for item count.** A React Context (`CartContext`) holds the
  live item count so the `Header` badge stays in sync with every add/remove operation
  without a full page reload.
- **Progressive enhancement.** The page is fully functional without JavaScript for the
  read path (SSR); interactivity layers on top.

---

## Architecture

### Request / render flow

```
Browser → GET /cart
  └─ Next.js Server Component (CartPage)
       ├─ reads access_token / token / accessToken cookie
       ├─ calls getCart(token)          ← src/lib/api/checkout.ts
       │    └─ fetch /api/proxy/cart    ← proxied to NEXT_PUBLIC_API_URL
       └─ renders:
            ├─ CartPageClient (client component, receives initialCart)
            │    ├─ CartItemList        (renders item cards)
            │    ├─ CartOrderSummary    (sticky panel: totals, coupon, CTA)
            │    └─ ConfirmRemoveModal  (inline confirmation dialog)
            └─ (falls through to SiteShell → Header + Footer)
```

### Route group placement

```
src/app/
  (main)/
    cart/
      page.tsx          ← Server Component, exports metadata
      loading.tsx       ← Suspense skeleton (Req 1.3)
      _components/
        CartPageClient.tsx       ← "use client", orchestrates state
        CartItemList.tsx         ← renders CartSummary-style item cards
        CartOrderSummary.tsx     ← right-column panel (totals, coupon, CTA)
        CartEmptyState.tsx       ← empty cart graphic + Browse Courses CTA
        ConfirmRemoveModal.tsx   ← inline confirm/cancel dialog
        CartSkeleton.tsx         ← loading state placeholder
```

The `(main)` route group contains no `layout.tsx` of its own (only `checkout/` exists
there today). The global `RootLayout` → `SiteShell` → `Header + Footer` chain already
wraps all routes uniformly.

### Cart Context for Header badge

A `CartContext` is introduced at the `RootLayout` level (inside `QueryProvider`). It holds
the live item count and exposes `setCartCount` so any client component can notify the header
after an optimistic add or remove:

```
RootLayout
  └─ QueryProvider
       └─ CartProvider          ← new: wraps all children
            └─ SiteShell
                 ├─ Header      ← reads cartCount from context
                 └─ {children}
```

`CartProvider` initialises `cartCount` to `null` (→ no badge) and provides
`setCartCount(n: number | null)`. The `CartPageClient` calls `setCartCount` after every
successful mutation; `Header` reads `cartCount` and renders the badge.

Because `Header` is already a `"use client"` component, consuming context requires no
architectural change to it.

---

## Components and Interfaces

### `CartPage` (Server Component — `page.tsx`)

```tsx
export const metadata = { title: "Cart — EduGenie" };

export default async function CartPage() {
  const token = /* read access_token / token / accessToken cookie */;
  const cart  = await getCart(token);          // null | Cart
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <CartPageClient initialCart={cart} />
    </main>
  );
}
```

- Never redirects on empty/null cart — the client component handles those states (Req 1.6,
  1.7, 4.3).
- Passes `null` down if `getCart` fails so the client can show the error UI.

### `CartPageClient` (Client Component)

Central state machine for the cart page. Props: `{ initialCart: Cart | null }`.

| State field       | Type                            | Purpose                                       |
|-------------------|---------------------------------|-----------------------------------------------|
| `items`           | `CartItem[]`                    | Optimistic item list                          |
| `subtotal`        | `number`                        | Displayed subtotal (sum of item prices)       |
| `total`           | `number`                        | Server total (may include discount)           |
| `fetchError`      | `"auth" \| "network" \| null`   | Distinguishes session vs network error        |
| `retryCount`      | `0 \| 1`                        | Limits manual retries to one (Req 9.3)        |
| `couponState`     | `CouponState`                   | (see below)                                   |

`CouponState`:
```ts
type CouponState =
  | { status: "hidden" }
  | { status: "open"; code: string; validating: boolean }
  | { status: "applied"; code: string; discountAmount: number }
  | { status: "error"; code: string; message: string; kind: "invalid" | "network" };
```

Responsibilities:
- Initialises state from `initialCart` (null → `fetchError`).
- Calls `setCartCount` on the context after every mutation.
- Hands item-removal callbacks down to `CartItemList`.
- Hands coupon callbacks and checkout callback down to `CartOrderSummary`.

### `CartItemList` (Client Component)

Thin wrapper around the existing `CartSummary` logic, adapted for the cart page context.
Accepts:

```ts
interface CartItemListProps {
  items: CartItem[];
  removingIds: Set<string>;
  errorIds: Map<string, string>;    // itemId → error message
  onRequestRemove: (id: string) => void;
  onDismissError:  (id: string) => void;
}
```

Renders:
- `full_course` items: thumbnail, title, instructor, "Full Course" badge, price, remove
  button (with confirm/spinner/error states).
- `section` items: grouped by `courseId`, course header once, then section rows in order.
- Inline error message per item with a dismiss control (Req 3.5, 3.6).
- Timeout handling: an `AbortController` per remove call; auto-aborts at 30 s and restores
  the item (Req 3.4).

Reuses `Thumbnail`, `getSafeImageSrc`, and `ConfirmRemoveModal` from the checkout flow.

### `CartOrderSummary` (Client Component)

Right-column sticky panel. Accepts:

```ts
interface CartOrderSummaryProps {
  items:         CartItem[];
  subtotal:      number;
  total:         number;
  couponState:   CouponState;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
  onCheckout:    () => void;
}
```

Renders:
- Line-item breakdown (full courses, grouped sections).
- Subtotal row.
- Discount row (only when coupon applied and `discountAmount > 0`).
- Total row.
- Coupon toggle / input / Apply-or-Remove button.
- "Proceed to Checkout — $X.XX" button (enabled/disabled by item count).
- Payment-method badges and security note (reused from `OrderSummary`).

### `CartEmptyState` (Client Component)

```ts
// No props — pure presentational
export default function CartEmptyState() { … }
```

Renders the shopping-cart SVG icon, "Your cart is empty" text, and a `<Link href="/courses">`
Browse Courses button simultaneously (Req 4.1). Not shown during loading (Req 4.4).

### `ConfirmRemoveModal` (Client Component)

Inline (not a portal dialog) confirm/cancel UI rendered within each item card. Accepts:

```ts
interface ConfirmRemoveModalProps {
  itemTitle:   string;
  onConfirm:   () => void;
  onCancel:    () => void;
}
```

Keeps the UX consistent with the existing checkout `CartSummary` inline confirm pattern.

### `CartSkeleton` (Server/Client Component — `loading.tsx`)

Renders placeholder elements for at least one item row (thumbnail rect, title rect, price
rect) and an order summary panel with shimmer animation (Req 1.3). Used as the
`loading.tsx` Suspense boundary for the `/cart` route.

### `CartContext` (`src/contexts/CartContext.tsx`)

```ts
interface CartContextValue {
  cartCount: number | null;          // null → no badge (loading / error)
  setCartCount: (n: number | null) => void;
}

export const CartContext = createContext<CartContextValue>(…);
export function CartProvider({ children }: { children: React.ReactNode }) { … }
```

Mounted in `RootLayout` wrapping `SiteShell`. Provides a `cartCount` atom that is the
single source of truth for the header badge.

### `Header` (updated)

Reads `cartCount` from `CartContext`. Renders the badge when `cartCount >= 1`:

- `1–99`: displays the exact count.
- `> 99`: displays `"99+"`.
- `0` or `null`: no badge.

The cart icon (`<Link href="/cart">`) is present in both the desktop nav row and the mobile
hamburger panel (Req 7.6).

---

## Data Models

All types are already defined in `src/types/checkout.ts` and are reused without modification:

```ts
// Existing — no changes needed
export type CartItemType = "full_course" | "section";

export interface CartItem {
  _id: string;
  type: CartItemType;
  courseId: string;
  courseTitle: string;
  thumbnail: string;
  instructorName: string;
  sectionId?: string;
  sectionTitle?: string;
  price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
}
```

### New coupon API types (`src/types/coupon.ts`)

```ts
export interface CouponValidationRequest {
  code: string;             // 1–100 characters
}

export interface CouponValidationResponse {
  valid:          boolean;
  discountAmount: number;   // server-calculated discount in the cart's currency
  updatedTotal:   number;   // total after discount
  message?:       string;   // rejection reason when valid=false
}
```

### New coupon API helper (`src/lib/api/coupon.ts`)

```ts
export async function validateCoupon(
  code: string
): Promise<CouponValidationResponse | null>
```

- `POST /api/proxy/coupon/validate` with body `{ code }`.
- Returns `null` on network error or non-semantic HTTP error (5xx).
- Returns `CouponValidationResponse` with `valid: false` for semantic rejection (4xx with
  error body).

### Cart Context state additions

No new backend types. The `CartContext` value is purely client-side.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions
of a system — essentially, a formal statement about what the system should do. Properties
serve as the bridge between human-readable specifications and machine-verifiable correctness
guarantees.*

#### Reflection: Consolidation before writing properties

Before finalising properties, redundant or overlapping candidates from the prework are
consolidated:

- **7.2 / 7.3 / 7.4** (badge display rules) are all instances of the same count-display
  invariant. They are merged into a single comprehensive property covering the full range
  `[0, ∞)`.
- **3.2 / 3.7** (optimistic removal / last-item removal) are both instances of "after
  removal the removed item is absent". They are merged into one removal invariant covering
  any-item and any-list-size (including size 1).
- **2.3 / 2.4** (subtotal equals sum, total equals Cart.total) are independent display
  invariants and are kept separate.
- **6.2 inverse / 6.5** (empty coupon input) is an edge case subsumed by the coupon
  validation property (6.2); no separate property needed.
- **2.1** (full_course rendering) and **2.2** (section grouping) are distinct rendering
  properties and remain separate.
- **5.3** and **5.5** (checkout navigation and button label formatting) are distinct
  properties and remain separate.

---

### Property 1: Subtotal equals sum of item prices

For any list of `CartItem` objects rendered on the cart page, the displayed subtotal value
must equal the arithmetic sum of all individual `CartItem.price` values in that list.

**Validates: Requirements 2.3**

---

### Property 2: Full-course card renders all required fields

For any `CartItem` with `type === "full_course"`, the rendered card must include the
`courseTitle`, `instructorName`, a "Full Course" badge, and the `price` value.

**Validates: Requirements 2.1**

---

### Property 3: Section items are grouped by courseId

For any list of `CartItem` objects that includes items of `type === "section"`, all items
sharing the same `courseId` must be rendered within a single group card, and the course
thumbnail and title must appear exactly once per group.

**Validates: Requirements 2.2**

---

### Property 4: Optimistic removal removes the target item

For any cart items list and any item in that list, after the remove action is confirmed and
the `removeFromCart` call is awaited successfully, the item with that `_id` must not appear
in the rendered output — regardless of list size (including a single-item list transitioning
to the empty state).

**Validates: Requirements 3.2, 3.7**

---

### Property 5: Failed removal restores the target item

For any `CartItem` that was optimistically removed from the rendered list, if the
`removeFromCart` API call returns `false` or throws an exception, that item must reappear in
the rendered list and an inline error message must be visible for that item.

**Validates: Requirements 3.5**

---

### Property 6: Empty state shows all three required elements simultaneously

For any render of the cart page where the cart contains zero items and the fetch has
completed, the non-text graphic element, the text "Your cart is empty", and the
"Browse Courses" button must all be present in the rendered output at the same time.

**Validates: Requirements 4.1**

---

### Property 7: Empty state is absent during loading

For any render of the cart page while the cart fetch is still in flight (pending state),
the Empty_State must not be present in the rendered output.

**Validates: Requirements 4.4**

---

### Property 8: Checkout navigation uses first item's courseId

For any non-empty `Cart` where `items[0].courseId` is a non-empty string, clicking "Proceed
to Checkout" must navigate to `/checkout/[courseId]` where `[courseId]` is exactly
`items[0].courseId`.

**Validates: Requirements 5.3**

---

### Property 9: Checkout button label formats total to two decimal places

For any `Cart.total` numeric value, the "Proceed to Checkout" button label must contain that
value formatted as a decimal number with exactly two decimal places
(e.g., `49` → `"$49.00"`, `49.5` → `"$49.50"`, `0` → `"$0.00"`).

**Validates: Requirements 5.5**

---

### Property 10: Coupon Apply is called for any non-empty code; skipped for empty

For any coupon code string of length 1–100 characters, clicking "Apply" must invoke the
coupon validation API. For any string of length 0 (empty), clicking "Apply" must not invoke
the API and must display a validation message.

**Validates: Requirements 6.2, 6.5**

---

### Property 11: Valid coupon renders discount breakdown and flips button

For any successful `CouponValidationResponse` with `discountAmount > 0`, the rendered panel
must include a labeled "Subtotal" line, a labeled discount line showing the subtracted
amount, the updated total, and the "Apply" button must be replaced by a "Remove" button.

**Validates: Requirements 6.3**

---

### Property 12: Invalid coupon leaves total unchanged

For any coupon code that the API rejects (returns `valid: false`), the `Cart.total`
displayed in the order summary must remain equal to its value before the coupon was
submitted.

**Validates: Requirements 6.4**

---

### Property 13: Applied coupon hides the coupon input field

For any state in which a valid coupon is applied (`couponState.status === "applied"`), the
coupon text input must not be present in the rendered output.

**Validates: Requirements 6.7**

---

### Property 14: Header badge reflects any cart item count correctly

For any non-negative integer `n` representing the cart item count:

- If `n === 0` (or cart data is `null`): the badge element must not be rendered.
- If `1 ≤ n ≤ 99`: the badge must display exactly `n` as a string.
- If `n > 99`: the badge must display `"99+"`.

**Validates: Requirements 7.2, 7.3, 7.4**

---

### Property 15: Cart count badge updates immediately after add or remove

For any cart state and any optimistic add or remove operation, the header badge count must
reflect the updated local count immediately — without requiring a page navigation or API
refetch.

**Validates: Requirements 7.5**

---

## Error Handling

### Fetch errors on initial load

| Scenario | Detection | UI response |
|---|---|---|
| `getCart` returns `null` | Server passes `null` as `initialCart` | Client shows generic error + "Try Again" |
| Auth cookie missing / expired | API returns 401; `getCart` returns `null` | Session-expired message + link to `/login` |
| Network failure | `fetch` throws; `getCart` catches → `null` | Network error message + "Try Again" |
| Re-fetch fails (second attempt) | `retryCount === 1` reached | Keep error state; no further auto-retry |

The client distinguishes auth vs. network by inspecting a `fetchError` field set during the
re-fetch attempt (`"auth"` vs. `"network"`). The server component cannot distinguish them at
SSR time because `getCart` normalises all failures to `null`; the initial render therefore
shows the generic error, and only the client-side "Try Again" path gains the distinction.

### Item removal errors

- **Optimistic removal**: item is hidden immediately on confirm click.
- **30 s timeout**: `AbortController` cancels the `fetch`; item is restored; inline
  `"Request timed out"` error shown.
- **API returns `false`**: item is restored; inline error shown.
- **Dismiss**: clears the error entry for that item from `errorIds` Map.

### Coupon errors

- **Empty code**: client-side validation; no API call; inline `"Please enter a coupon
  code"` message below input.
- **Semantic rejection** (`valid: false`): inline `"Invalid or expired coupon code"` below
  input; total unchanged.
- **Network / 5xx** (`validateCoupon` returns `null`): inline `"Could not connect to
  validate the coupon. Please try again."` (distinct wording from invalid-code message);
  total unchanged.

### Checkout navigation errors

- `items[0].courseId` empty: inline error on the button; no navigation.
- `initiateCheckout` failure: surfaced by the existing checkout page flow (out of scope for
  the cart page itself).

---

## Testing Strategy

### Unit / component tests (Vitest + React Testing Library)

Unit tests cover specific examples, edge cases, and error conditions where a single concrete
scenario is more communicative than a generator:

- `CartEmptyState` renders all three required elements.
- `CartSkeleton` renders placeholder elements (not the empty state).
- "Browse Courses" click calls `router.push('/courses')`.
- Remove confirmation dialog appears before any API call.
- Cancel confirmation restores item without API call.
- Dismiss inline error re-enables remove button.
- "Try Again" triggers exactly one re-fetch; second failure keeps error state.
- Session-expired error includes `/login` link.
- "Proceed to Checkout" is disabled when cart is empty.
- Missing `courseId` on checkout click shows inline error without navigating.
- Coupon toggle shows/hides input.
- Network error on coupon shows distinct message from invalid-code error.
- Cart icon in Header links to `/cart`.
- Cart icon present in both desktop nav and mobile menu.

### Property-based tests (fast-check, ≥ 100 iterations each)

The project's stack (Next.js 15, React 19, TypeScript) pairs well with
[fast-check](https://fast-check.io/). Each test below corresponds to a numbered correctness
property in the design.

**Setup**: Install `fast-check` as a dev dependency. Tests run with Vitest.

```bash
npm install --save-dev fast-check
```

Tag format for each test: `// Feature: cart-page, Property N: <property text>`

| Property | Generator inputs | What is asserted |
|---|---|---|
| P1 Subtotal equals sum | Arbitrary `CartItem[]` with numeric prices | `renderedSubtotal === items.reduce((s,i) => s+i.price, 0)` |
| P2 Full-course card fields | Arbitrary `CartItem` with `type="full_course"` | All four fields present in rendered output |
| P3 Section grouping | Arbitrary `CartItem[]` with `type="section"`, varying `courseId` | Each `courseId` group renders thumbnail+title exactly once |
| P4 Optimistic removal | Arbitrary non-empty `CartItem[]`, random index to remove | Removed item's `_id` absent from rendered output |
| P5 Failed removal restores | Arbitrary `CartItem[]`, mock `removeFromCart→false` | Removed item reappears; error message visible |
| P6 Empty state elements | (no generator, but any path to zero-item state) | All three elements co-present in output |
| P7 No empty state during load | Pending fetch state | `CartEmptyState` not in rendered output |
| P8 Checkout navigation | Arbitrary non-empty `Cart`, non-empty `courseId` | `router.push` called with `/checkout/${items[0].courseId}` |
| P9 Button label formatting | Arbitrary non-negative `number` as `Cart.total` | Button text matches `/\$\d+\.\d{2}/` and value equals input |
| P10 Coupon Apply gating | Strings of length 0–100 | Length ≥1 → API called; length 0 → API not called |
| P11 Valid coupon rendering | Arbitrary `CouponValidationResponse` with `discountAmount>0` | Subtotal, discount, updated total, Remove button all present |
| P12 Invalid coupon total unchanged | Arbitrary rejected coupon + original Cart.total | Rendered total equals original total |
| P13 Applied coupon hides input | Applied coupon state | Coupon text input not in DOM |
| P14 Badge count display | Arbitrary non-negative integer `n` | Badge absent/exact/`"99+"` per range |
| P15 Optimistic badge update | Arbitrary pre-mutation cart count + operation | Badge count equals post-mutation expected count immediately |

**Configuration**:
```ts
// vitest.config.ts — no changes needed; fast-check integrates with standard test runners
fc.configureGlobal({ numRuns: 100 });
```

### Integration tests

- Authenticated session: verify `/api/proxy/cart` returns only the authenticated student's
  cart (one representative example; not PBT — external API behaviour).
- Cart icon count persists across navigation between pages (one smoke test).
