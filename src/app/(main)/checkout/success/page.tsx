// src/app/(main)/checkout/success/page.tsx
// Server Component — resolves the order, then hands off to a client component
// that confirms the payment (polling while the webhook lands) and redirects
// the student to their enrollments (My Learning).

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

  // Paymob appends its result to the redirection_url (?success=true|false).
  const paymobSuccess =
    typeof resolvedParams.success === "string"
      ? resolvedParams.success
      : undefined;

  // Guard: no order reference at all → nothing to show.
  if (!orderId) redirect("/courses");

  // Paymob explicitly told us the payment failed → send to the failed page.
  if (paymobSuccess === "false") {
    redirect(`/checkout/failed?orderId=${orderId}`);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value ?? undefined;

  // The webhook may not have flipped the order to COMPLETED yet, so we DON'T
  // bounce on a pending order — the client component polls and waits.
  const order: Order | null = await getOrder(orderId, token);

  return <SuccessContent orderId={orderId} initialOrder={order} />;
}
