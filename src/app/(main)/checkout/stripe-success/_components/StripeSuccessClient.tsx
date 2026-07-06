"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { confirmStripeCheckout } from "@/lib/api/checkout";

/**
 * Landing page after a Stripe student checkout. Fulfillment is normally granted
 * by the `checkout.session.completed` webhook, but that can miss locally, so we
 * ALSO confirm the session here (idempotent server-side) before sending the
 * student to My Learning — guaranteeing the enrollment + cart cleanup happen.
 */
export default function StripeSuccessClient({
  status,
  sessionId,
}: {
  status: "success" | "cancel";
  sessionId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (status !== "success") return;
    let cancelled = false;

    (async () => {
      // Confirm+fulfill from the return redirect (webhook-independent).
      if (sessionId) {
        await confirmStripeCheckout(sessionId);
      }
      if (cancelled) return;
      // Refresh anything that depends on ownership / cart now it's fulfilled.
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    })();

    const tick = setInterval(() => setCountdown((c) => c - 1), 1000);
    const go = setTimeout(() => router.push("/profile"), 5000);
    return () => {
      cancelled = true;
      clearInterval(tick);
      clearTimeout(go);
    };
  }, [status, sessionId, router, queryClient]);

  if (status === "cancel") {
    return (
      <div className="max-w-md mx-auto mt-16 text-center px-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl">
          ✕
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-800">Checkout canceled</h1>
        <p className="mt-1 text-slate-500">No charge was made.</p>
        <Link
          href="/courses"
          className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-bold"
        >
          Browse courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 text-center px-6">
      <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">
        ✓
      </div>
      <h1 className="mt-4 text-xl font-bold text-slate-800">Payment complete 🎉</h1>
      <p className="mt-1 text-slate-500">
        Your course is being unlocked. Taking you to My Learning in {countdown}s…
      </p>
      <Link
        href="/profile"
        className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-bold"
      >
        Go to My Learning now
      </Link>
    </div>
  );
}
