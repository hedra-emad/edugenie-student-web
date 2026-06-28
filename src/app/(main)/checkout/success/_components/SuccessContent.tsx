"use client";
// src/app/(main)/checkout/success/_components/SuccessContent.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { getOrder } from "@/lib/api/checkout";
import type { Order } from "@/types/checkout";

const BRAND = "#3B1892";
const ENROLLMENTS_PATH = "/profile"; // My Learning lives here (default tab)
const REDIRECT_SECONDS = 6;
const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 8; // ~20s of waiting for the webhook to land

type Phase = "confirming" | "success" | "processing" | "failed";

interface SuccessContentProps {
  orderId: string;
  initialOrder: Order | null;
}

function phaseFromOrder(order: Order | null): Phase {
  if (!order) return "confirming";
  if (order.status === "COMPLETED") return "success";
  if (order.status === "FAILED") return "failed";
  return "confirming";
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function SuccessContent({
  orderId,
  initialOrder,
}: SuccessContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [phase, setPhase] = useState<Phase>(phaseFromOrder(initialOrder));
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const pollsRef = useRef(0);

  // If Paymob rendered this success page INSIDE the embedded checkout iframe,
  // break out to the top window so the full-page success experience shows
  // (and the subsequent redirect to My Learning navigates the real window).
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.top &&
      window.top !== window.self
    ) {
      window.top.location.href = window.location.href;
    }
  }, []);

  // Make sure My Learning shows the fresh enrollment when we land on /profile.
  const goToEnrollments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    router.push(ENROLLMENTS_PATH);
    router.refresh();
  }, [queryClient, router]);

  // ── Poll the order until the webhook flips it to COMPLETED / FAILED ──────────
  useEffect(() => {
    if (phase !== "confirming") return;

    let cancelled = false;
    const timer = setInterval(async () => {
      pollsRef.current += 1;
      const fresh = await getOrder(orderId);

      if (cancelled) return;

      if (fresh) {
        setOrder(fresh);
        if (fresh.status === "COMPLETED") {
          setPhase("success");
          return;
        }
        if (fresh.status === "FAILED") {
          setPhase("failed");
          return;
        }
      }

      // Webhook hasn't arrived in time — show a reassuring "processing" state
      // instead of spinning forever. (Common on local dev without a public
      // webhook URL; the enrollment completes once the webhook is delivered.)
      if (pollsRef.current >= MAX_POLLS) {
        setPhase("processing");
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [phase, orderId]);

  // ── On success, refresh enrollments and start the auto-redirect countdown ────
  useEffect(() => {
    if (phase !== "success") return;
    queryClient.invalidateQueries({ queryKey: ["enrollments"] });

    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          goToEnrollments();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [phase, queryClient, goToEnrollments]);

  // ── Shell ────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-b from-violet-50 via-white to-white">
      <div className="w-full max-w-lg animate-[fadeUp_0.5s_ease-out]">
        {phase === "confirming" && <Confirming />}
        {phase === "processing" && (
          <Processing orderId={orderId} onContinue={goToEnrollments} />
        )}
        {phase === "failed" && <Failed />}
        {phase === "success" && order && (
          <SuccessCard
            order={order}
            countdown={countdown}
            onContinue={goToEnrollments}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pop {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          60% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}

// ── Confirming (waiting for webhook) ──────────────────────────────────────────
function Confirming() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
      <div className="flex justify-center mb-6">
        <svg
          className="animate-spin w-12 h-12"
          style={{ color: BRAND }}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      </div>
      <h1 className="text-xl font-extrabold text-slate-900 mb-2">
        Confirming your payment…
      </h1>
      <p className="text-[13.5px] text-slate-500 leading-relaxed">
        Hang tight — we&apos;re finalizing your order. This usually takes just a
        few seconds.
      </p>
    </div>
  );
}

// ── Processing (webhook slow / not reachable) ─────────────────────────────────
function Processing({
  orderId,
  onContinue,
}: {
  orderId: string;
  onContinue: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
      <h1 className="text-xl font-extrabold text-slate-900 mb-2">
        Payment received — finalizing your access
      </h1>
      <p className="text-[13.5px] text-slate-500 leading-relaxed mb-6">
        Thank you! Your payment went through. Your course will appear in{" "}
        <span className="font-semibold text-slate-700">My Learning</span> within
        a moment. You can head there now and refresh if needed.
      </p>
      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: BRAND }}
      >
        Go to My Learning
      </button>
      <p className="text-[11px] text-slate-400 mt-4">
        Reference #{orderId.slice(-8)}
      </p>
    </div>
  );
}

// ── Failed ────────────────────────────────────────────────────────────────────
function Failed() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>
      <h1 className="text-xl font-extrabold text-slate-900 mb-2">
        Payment was not completed
      </h1>
      <p className="text-[13.5px] text-slate-500 leading-relaxed mb-6">
        Your card was not charged. You can try again from your cart.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/cart"
          className="flex-1 py-3 rounded-xl text-[14px] font-bold text-white text-center transition-opacity hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          Back to Cart
        </Link>
        <Link
          href="/courses"
          className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-slate-600 bg-white border border-slate-200 text-center hover:bg-slate-50 transition-colors"
        >
          Browse Courses
        </Link>
      </div>
    </div>
  );
}

// ── Success ───────────────────────────────────────────────────────────────────
function SuccessCard({
  order,
  countdown,
  onContinue,
}: {
  order: Order;
  countdown: number;
  onContinue: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-10">
      {/* Animated check */}
      <div className="flex justify-center mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background:
              "radial-gradient(circle at center, #d1fae5 0%, #ecfdf5 70%)",
            animation: "pop 0.5s ease-out",
          }}
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          You&apos;re enrolled! 🎉
        </h1>
        <p className="text-slate-500 text-[13.5px] leading-relaxed">
          Your payment was successful and your course is ready in My Learning.
        </p>
      </div>

      {/* Order details */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12.5px] font-bold text-slate-900">
            Order #{order.orderId.slice(-8)}
          </p>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            Paid
          </span>
        </div>

        <div className="flex flex-col gap-2.5 mb-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 line-clamp-1">
                  {item.courseTitle}
                </p>
                {item.sectionTitle && (
                  <p className="text-[11.5px] text-slate-400 mt-0.5">
                    {item.sectionTitle}
                  </p>
                )}
              </div>
              <span className="text-[13px] font-bold text-slate-800 flex-shrink-0">
                ${item.price}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 my-3" />

        <div className="flex items-center justify-between">
          <span className="text-[13px] font-extrabold text-slate-900">
            Total paid
          </span>
          <span className="text-[18px] font-extrabold" style={{ color: BRAND }}>
            ${order.total}
          </span>
        </div>

        {order.paidAt && (
          <p className="text-[11px] text-slate-400 mt-3">
            Paid on {formatDate(order.paidAt)}
          </p>
        )}
      </div>

      {/* Primary action */}
      <button
        onClick={onContinue}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: BRAND }}
      >
        Start Learning
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>

      {/* Auto-redirect note + secondary action */}
      <p className="text-center text-[12px] text-slate-400 mt-4">
        Taking you to My Learning in{" "}
        <span className="font-bold text-slate-600">{countdown}s</span> ·{" "}
        <Link href="/courses" className="font-semibold hover:underline" style={{ color: BRAND }}>
          browse more courses
        </Link>
      </p>
    </div>
  );
}
