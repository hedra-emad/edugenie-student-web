"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { forgotPassword } from "@/lib/api/auth";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(
        (err as Error)?.message ?? "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {sent ? (
          <div className="text-center">
            <MailCheck className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
            <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
            <p className="mt-2 text-sm text-gray-500">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent
              a link to reset your password. The link expires in 60 minutes.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-semibold text-[#3B1892] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              Forgot your password?
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-[#3B1892] focus:ring-1 focus:ring-[#3B1892]"
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <Button type="submit" fullWidth loading={loading}>
                Send reset link
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-500">
              Remembered it?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#3B1892] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
