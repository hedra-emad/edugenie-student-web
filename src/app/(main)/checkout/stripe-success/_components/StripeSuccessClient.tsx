"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Landing page after a Stripe student checkout. The `checkout.session.completed`
 * webhook grants the enrollment server-side; here we just confirm and send the
 * student to My Learning (giving the webhook a moment to land).
 */
export default function StripeSuccessClient({
  status,
}: {
  status: "success" | "cancel";
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (status !== "success") return;
    // Refresh anything that depends on ownership once the webhook has fulfilled.
    queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    const tick = setInterval(() => setCountdown((c) => c - 1), 1000);
    const go = setTimeout(() => router.push("/profile"), 5000);
    return () => {
      clearInterval(tick);
      clearTimeout(go);
    };
  }, [status, router, queryClient]);

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
