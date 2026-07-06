import StripeSuccessClient from "./_components/StripeSuccessClient";

// Stripe redirects here after a student checkout (?purchase=success|cancel).
// Next.js 16: searchParams is a Promise and must be awaited.
export default async function StripeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ purchase?: string }>;
}) {
  const { purchase } = await searchParams;
  return <StripeSuccessClient status={purchase === "cancel" ? "cancel" : "success"} />;
}
