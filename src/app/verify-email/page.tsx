"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { verifyEmail, verifyExchangeToken, handoffCode } from "@/lib/api/auth";

const ANGULAR_URL =
  process.env.NEXT_PUBLIC_ANGULAR_APP_URL || "http://localhost:4200";

// "verifying" → confirming token · "signing-in" → verified, establishing session
// "success" → verified but no auto-redirect (staff/deactivated) · "error" → bad token
type Phase = "verifying" | "signing-in" | "success" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState("");
  // Guard against React StrictMode's double-invoke: the token is single-use, so
  // a second call would fail and clobber a successful verification.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setPhase("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    (async () => {
      try {
        const res = await verifyEmail({ token });
        const role = res?.data?.user?.role;
        const exchangeToken = res?.data?.exchangeToken;

        setPhase("signing-in");

        if (role === "instructor") {
          // Backend already set the session cookie — hand off to the dashboard.
          const handoff = await handoffCode().catch(() => null);
          if (handoff?.code) {
            window.location.href = `${ANGULAR_URL}/auth/redeem?code=${handoff.code}`;
            return;
          }
          // Handoff failed — verified, so let them sign in manually.
          setPhase("success");
          setMessage("Your email is verified. Please sign in to continue.");
          return;
        }

        // Student: finalize the httpOnly session cookie, then go home logged in.
        if (exchangeToken) {
          await verifyExchangeToken({ token: exchangeToken });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          router.replace("/");
          router.refresh();
          return;
        }

        // No session token (e.g. deactivated account) — verified but not logged in.
        setPhase("success");
        setMessage("Your email is verified. Please sign in to continue.");
      } catch (err: unknown) {
        setPhase("error");
        setMessage(
          (err as { message?: string })?.message ??
            "This verification link is invalid or has expired.",
        );
      }
    })();
  }, [searchParams, router, queryClient]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      {(phase === "verifying" || phase === "signing-in") && (
        <>
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#3B1892]" />
          <h1 className="text-2xl font-bold text-gray-800">
            {phase === "verifying"
              ? "Verifying your email…"
              : "Email verified — signing you in…"}
          </h1>
          <p className="mt-2 max-w-sm text-gray-500">
            Just a moment, this won&apos;t take long.
          </p>
        </>
      )}

      {phase === "success" && (
        <>
          <CheckCircle2 className="mb-4 h-14 w-14 text-emerald-500" />
          <h1 className="text-2xl font-bold text-gray-900">Email verified</h1>
          <p className="mt-2 max-w-sm text-gray-500">
            {message || "Your email is confirmed. You can now sign in."}
          </p>
          <Link
            href="/login"
            className="mt-6 rounded-xl bg-[#3B1892] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2A1069]"
          >
            Go to sign in
          </Link>
        </>
      )}

      {phase === "error" && (
        <>
          <XCircle className="mb-4 h-14 w-14 text-rose-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Verification failed
          </h1>
          <p className="mt-2 max-w-sm text-gray-500">{message}</p>
          <Link
            href="/login"
            className="mt-6 rounded-xl border border-[#3B1892] px-6 py-3 text-sm font-bold text-[#3B1892] transition-colors hover:bg-violet-50"
          >
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#3B1892]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
