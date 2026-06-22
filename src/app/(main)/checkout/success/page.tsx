// src/app/(main)/checkout/success/page.tsx
// Server Component — validates the order server-side before rendering.

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getOrder } from "@/lib/api/checkout";
import SuccessContent from "./_components/SuccessContent";
import type { Order } from "@/types/checkout";

export const metadata = {
  title: "Payment Successful — EduGenie",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const orderId =
    typeof resolvedParams.orderId === "string"
      ? resolvedParams.orderId
      : undefined;

  // Guard: no orderId
  if (!orderId) redirect("/courses");

  const cookieStore = await cookies();
  const token =
    cookieStore.get("access_token")?.value ??
    cookieStore.get("token")?.value ??
    cookieStore.get("accessToken")?.value ??
    undefined;

  const order: Order | null = await getOrder(orderId, token);

  // Guard: order not found or not completed
  if (!order || order.status !== "COMPLETED") redirect("/courses");

  return <SuccessContent order={order} />;
}
