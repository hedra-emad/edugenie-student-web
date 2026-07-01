"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { verifyEmail } from "@/lib/api/auth";

type Phase = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setPhase("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    verifyEmail({ token })
      .then(() => setPhase("success"))
      .catch((err) => {
        setPhase("error");
        setMessage(
          err?.message ?? "This verification link is invalid or has expired.",
        );
      });
  }, [searchParams]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      {phase === "verifying" && (
        <>
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#3B1892]" />
          <h1 className="text-2xl font-bold text-gray-800">
            Verifying your email…
          </h1>
        </>
      )}

      {phase === "success" && (
        <>
          <CheckCircle2 className="mb-4 h-14 w-14 text-emerald-500" />
          <h1 className="text-2xl font-bold text-gray-900">Email verified</h1>
          <p className="mt-2 max-w-sm text-gray-500">
            Your email is confirmed. You can now sign in to your account.
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
