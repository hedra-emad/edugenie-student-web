// src/app/(main)/cart/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCart } from "@/lib/api/checkout";
import CartPageClient from "./_components/CartPageClient";

export const metadata = { title: "Cart — EduGenie" };

export default async function CartPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  if (!token) {
    redirect("/login");
  }

  const cart = await getCart(token);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <CartPageClient initialCart={cart} />
    </main>
  );
}
