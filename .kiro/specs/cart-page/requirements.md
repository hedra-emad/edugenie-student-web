# Requirements Document

## Introduction

The Cart Page is a dedicated `/cart` route in the EduGenie student web application. It gives students a central place to review, manage, and act on every course and section they have queued for purchase before proceeding to checkout. Currently, the add-to-cart action on the course detail page sends students directly to `/checkout/[courseId]`, bypassing any intermediate review step. The cart page bridges that gap: students can visit `/cart` at any time, remove unwanted items, apply coupon codes, review pricing, and navigate to checkout — or continue browsing.

The implementation builds on the existing `Cart`, `CartItem`, and `CheckoutResponse` types in `src/types/checkout.ts`, the `getCart`, `removeFromCart`, and `addToCart` API helpers in `src/lib/api/checkout.ts`, and the visual/UX conventions established in the checkout flow components.

## Glossary

- **Cart_Page**: The dedicated `/cart` route and its associated React components that render the student's pending cart.
- **Cart**: The server-side data structure containing a list of `CartItem` objects and computed `subtotal` / `total` monetary values.
- **CartItem**: A single item in the cart, which is either a `full_course` or a `section` purchase, as defined in `src/types/checkout.ts`.
- **Cart_Icon**: A clickable icon in the site header that shows the current item count and links to `/cart`.
- **Item_Count**: The number of distinct `CartItem` entries currently in the student's cart.
- **Coupon**: A promotional code that, when valid, reduces the `total` by a server-calculated discount amount.
- **Checkout_Flow**: The existing `/checkout/[courseId]` route and its payment process via Paymob.
- **Empty_State**: The UI shown when the cart contains zero items.
- **Student**: An authenticated or unauthenticated user of the EduGenie student web application.
- **SiteShell**: The shared layout wrapper defined in `src/components/layout/SiteShell.tsx` that renders the `Header` and wraps all pages.
- **Header**: The top navigation bar rendered by `src/components/layout/Header.tsx`.

---

## Requirements

### Requirement 1: Cart Page Route and Layout

**User Story:** As a student, I want a dedicated cart page at `/cart`, so that I can review everything I plan to buy in one place before proceeding to payment.

#### Acceptance Criteria

1. THE Cart_Page SHALL be accessible at the `/cart` route within the `(main)` route group.
2. WHEN a student navigates to `/cart`, THE Cart_Page SHALL read the `access_token`, `token`, or `accessToken` cookie (whichever is present) and pass it to the `getCart` helper; the page SHALL render the returned cart data.
3. WHILE the cart data is loading, THE Cart_Page SHALL display a loading skeleton containing placeholder elements for at least one cart item row (thumbnail, title, price) and an order summary panel.
4. THE Header and footer defined by `SiteShell` SHALL remain visible throughout the entire loading process, including while cart data is loading and after loading completes, without reloading.
5. THE Cart_Page SHALL have a page title of `"Cart — EduGenie"` set via Next.js metadata.
6. IF `getCart` returns `null` at any point (including while the page is still loading), THEN THE Cart_Page SHALL immediately display a user-facing error message and a "Try Again" button that re-invokes `getCart`, without waiting for loading to complete.
7. WHEN `getCart` returns a `Cart` with zero items, THE Cart_Page SHALL display the Empty_State defined in Requirement 4 rather than an error.

---

### Requirement 2: Cart Item Display

**User Story:** As a student, I want to see every item in my cart clearly, so that I can verify what I am about to purchase.

#### Acceptance Criteria

1. WHEN the cart contains items of type `full_course`, THE Cart_Page SHALL display each item's thumbnail, course title, instructor name, a "Full Course" badge, and price; IF the thumbnail URL is missing or the image fails to load, THE Cart_Page SHALL display a placeholder image in its place.
2. WHEN the cart contains items of type `section` and the cart item count is greater than zero, THE Cart_Page SHALL group them by `courseId` and display the course thumbnail and title once per group, followed by each section title and individual price in ascending order by section position within the course; IF the thumbnail URL is missing or the image fails to load, THE Cart_Page SHALL display a placeholder image in its place.
3. WHEN the cart contains one or more items, THE Cart_Page SHALL display a subtotal line that equals the sum of all individual `CartItem.price` values rendered on the page; WHEN the cart contains zero items, THE Cart_Page SHALL NOT display the subtotal line.
4. THE Cart_Page SHALL display the server-calculated `Cart.total` as the final payable amount.
5. IF `Cart.total` differs from `Cart.subtotal`, THEN THE Cart_Page SHALL display the original subtotal labeled "Subtotal" and the discounted total labeled "Total" so the saving is visible to the student.
6. WHEN the cart contains zero items, THE Cart_Page SHALL display the Empty_State and SHALL NOT render any item rows, subtotal, or total lines; WHEN the cart contains one or more items, THE Cart_Page SHALL NOT display the Empty_State regardless of any other condition.

---

### Requirement 3: Remove Items from Cart

**User Story:** As a student, I want to remove individual items from my cart, so that I only purchase what I actually want.

#### Acceptance Criteria

1. WHEN a student clicks the remove button for any cart item, THE Cart_Page SHALL display a modal confirmation dialog before calling `removeFromCart`.
2. WHEN a student confirms removal, THE Cart_Page SHALL call the `removeFromCart` API helper with the item's `_id` and optimistically remove the item from the displayed list.
3. WHEN a student cancels the removal confirmation, THE Cart_Page SHALL restore the item to the displayed list without making an API call.
4. WHILE a removal API call is in flight, THE Cart_Page SHALL display a loading spinner on the remove button and disable the remove button for that item; IF the API call does not resolve within 30 seconds, THE Cart_Page SHALL abort the request, restore the item to the displayed list, and show an inline timeout error message for that item.
5. IF the `removeFromCart` API call returns `false` or throws an exception, THEN THE Cart_Page SHALL restore the item in the displayed list and show an inline error message for that item.
6. WHEN an inline error message is shown for an item, THE Cart_Page SHALL provide a dismiss control; WHEN the student dismisses the message, THE Cart_Page SHALL remove the inline error and re-enable the remove button for that item.
7. WHEN the cart item count reaches zero for any reason (including all items being removed), THE Cart_Page SHALL transition to the Empty_State without a page reload; IF a student cancels a removal and items remain in the cart, THE Cart_Page SHALL NOT transition to the Empty_State.

---

### Requirement 4: Empty Cart State

**User Story:** As a student, I want a helpful message when my cart is empty, so that I know to browse for courses to add.

#### Acceptance Criteria

1. WHEN the cart contains zero items, THE Cart_Page SHALL simultaneously display a visible non-text graphic element, the message "Your cart is empty", and a "Browse Courses" call-to-action button — all three elements SHALL be present in the viewport at the same time.
2. WHEN a student clicks "Browse Courses" in the Empty_State, THE Cart_Page SHALL navigate the student to `/courses`.
3. THE Cart_Page SHALL NOT redirect students away from `/cart` automatically when the cart is empty; the Empty_State SHALL be shown in place.
4. WHILE the cart data is loading, THE Cart_Page SHALL NOT display the Empty_State; the Empty_State SHALL only be shown after the cart fetch has completed and returned zero items.

---

### Requirement 5: Proceed to Checkout

**User Story:** As a student, I want a clear call-to-action to proceed to payment from the cart page, so that I can complete my purchase without confusion.

#### Acceptance Criteria

1. WHEN the cart contains at least one item, THE Cart_Page SHALL display a "Proceed to Checkout" button that is enabled, full-width, uses a filled background color, and is visually distinct from any secondary action buttons on the page.
2. WHEN the cart contains zero items, THE Cart_Page SHALL display the "Proceed to Checkout" button in a disabled state that prevents interaction (not clickable, visually dimmed).
3. WHEN a student clicks "Proceed to Checkout" and `cart.items[0].courseId` is a non-empty string, THE Cart_Page SHALL navigate the student to `/checkout/[courseId]` where `[courseId]` is `cart.items[0].courseId`.
4. IF `cart.items[0].courseId` is missing or empty when the student clicks "Proceed to Checkout", THEN THE Cart_Page SHALL display an inline error message and SHALL NOT navigate away from `/cart`.
5. THE Cart_Page SHALL display `Cart.total` formatted as a dollar amount rounded to two decimal places on the "Proceed to Checkout" button label, for example "Proceed to Checkout — $49.00".

---

### Requirement 6: Coupon Code Entry

**User Story:** As a student, I want to enter a coupon code on the cart page, so that I can apply a discount before paying.

#### Acceptance Criteria

1. THE Cart_Page SHALL display a "Have a coupon?" toggle that, when clicked, reveals a text input (accepting 1–100 characters) and an "Apply" button.
2. WHEN a student enters a coupon code (1–100 characters) and clicks "Apply", THE Cart_Page SHALL submit the code to the coupon validation API endpoint.
3. WHEN the coupon validation API returns a valid coupon, THE Cart_Page SHALL display the original subtotal, the discount amount as a labeled line item (e.g. "Discount: −$10.00"), and the updated discounted total; the "Apply" button SHALL become a "Remove" button to allow the student to cancel the applied coupon; IF the coupon validation API returns an invalid or expired coupon, the "Apply" button SHALL remain as "Apply" and SHALL NOT change to "Remove".
4. WHEN the coupon validation API returns a semantic rejection (invalid or expired coupon code), THE Cart_Page SHALL display an inline error message below the coupon input and leave `Cart.total` unchanged.
5. IF the coupon input is empty when the student clicks "Apply", THEN THE Cart_Page SHALL NOT submit the request and SHALL display a validation message instructing the student to enter a code.
6. IF the coupon validation API call fails due to a network error or returns a non-semantic HTTP error (5xx), THEN THE Cart_Page SHALL display an inline error message distinguishing the failure from an invalid code and leave `Cart.total` unchanged.
7. WHEN a valid coupon is already applied, THE Cart_Page SHALL NOT allow a second coupon to be applied simultaneously; the coupon input SHALL remain hidden until the student removes the current coupon. WHEN no coupon is currently applied, the coupon input SHALL be available for normal entry.

---

### Requirement 7: Cart Icon in Header with Item Count Badge

**User Story:** As a student, I want to see a cart icon in the header with a live item count, so that I always know how many items are in my cart and can quickly navigate to the cart page.

#### Acceptance Criteria

1. THE Header SHALL display a Cart_Icon that links to `/cart`.
2. WHEN the student's cart contains one or more items, THE Header SHALL display an Item_Count badge on the Cart_Icon showing the total number of `CartItem` entries; IF the count exceeds 99, THE badge SHALL display "99+" instead of the exact number.
3. WHEN the student's cart contains zero items, THE Header SHALL display the Cart_Icon without a badge; WHEN the student's cart contains one or more items, THE Header SHALL display the Item_Count badge on the Cart_Icon.
4. IF the cart data is unavailable (API error, null response, or fetch not yet complete), THEN THE Header SHALL display the Cart_Icon without a badge.
5. WHEN a student adds or removes items, THE Header SHALL process the operations sequentially and update the Item_Count badge to reflect the final count after all operations complete, without requiring a full page reload.
6. THE Cart_Icon SHALL be rendered and interactive on both viewports narrower than 1024 px and viewports 1024 px and wider, including inside the mobile hamburger menu panel.

---

### Requirement 8: Responsive Layout

**User Story:** As a student, I want the cart page to be usable on any screen size, so that I can manage my cart from a phone, tablet, or desktop.

#### Acceptance Criteria

1. WHILE the viewport width is narrower than 1024 px, THE Cart_Page SHALL render cart items above the order summary in a single-column stacked layout.
2. WHILE the viewport width is 1024 px or wider, THE Cart_Page SHALL render a two-column layout with cart items on the left and an order summary panel on the right that remains visible as the student scrolls down the page.
3. WHILE the viewport width is narrower than 1024 px, THE Cart_Page SHALL ensure all interactive elements (remove buttons, coupon input, "Proceed to Checkout") have touch targets of at least 44 × 44 px.
4. WHEN a student resizes the browser window, THE Cart_Page SHALL apply the layout corresponding to the new viewport width without requiring a page reload.

---

### Requirement 9: Authentication Awareness

**User Story:** As a student, I want the cart page to handle my authentication state correctly, so that I can see my personal cart and not someone else's.

#### Acceptance Criteria

1. WHEN an authenticated student visits `/cart`, THE Cart_Page SHALL display only the cart items associated with that student's account.
2. IF the `getCart` API call returns `null` or an authentication error response, THEN THE Cart_Page SHALL display an error message informing the student that their session may have expired, with a link to `/login`.
3. IF a network error occurs during the initial cart fetch, THEN THE Cart_Page SHALL display a user-facing error message and a "Try Again" button that triggers exactly one re-fetch; IF the re-fetch also fails, THE Cart_Page SHALL keep the error state visible without further automatic retries.
