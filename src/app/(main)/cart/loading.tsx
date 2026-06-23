// src/app/(main)/cart/loading.tsx
// Next.js Suspense boundary for the /cart route.
// Requirements: 1.3
import CartSkeleton from "./_components/CartSkeleton";

export default function CartLoading() {
  return <CartSkeleton />;
}
