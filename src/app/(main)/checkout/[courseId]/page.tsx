// src/app/(main)/checkout/[courseId]/page.tsx
// Server Component — reads the cart server-side and passes it to the client.

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCart } from "@/lib/api/checkout";
import CheckoutClient from "./_components/CheckoutClient";

export const metadata = {
  title: "Checkout — EduGenie",
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  // params is a Promise in Next.js 15+
  await params; // courseId available if needed for future per-course cart filtering

  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value ?? undefined;

  const cart = await getCart(token);

  // Redirect when cart is missing or empty
  if (!cart || cart.items.length === 0) {
    redirect("/courses");
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            EduGenie
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Complete your order
          </h1>
          <p className="text-slate-600 text-[13.5px] leading-relaxed mt-1">
            Review your items and confirm payment
          </p>
        </div>

        {/* Two-column layout */}
        <CheckoutClient initialCart={cart} />
      </div>
    </main>
  );
}
