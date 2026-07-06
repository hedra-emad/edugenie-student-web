"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthLogo from "@/components/auth/AuthLogo";
import AuthCard from "@/components/auth/AuthCard";
import AuthTabs from "@/components/auth/AuthTabs";
import AuthInput from "@/components/auth/AuthInput";
import PasswordInput from "@/components/auth/PasswordInput";
import RememberMe from "@/components/auth/RememberMe";
import AuthButton from "@/components/auth/AuthButton";
import AuthDivider from "@/components/auth/AuthDivider";
import SocialLogin from "@/components/auth/SocialLogin";
import { redirectToGoogleAuth } from "@/lib/api/auth/googleAuth";
import {
  login,
  verifyExchangeToken,
  handoffCode,
  logout,
  resendVerification,
} from "@/lib/api/auth";
import { useQueryClient } from "@tanstack/react-query";

const ANGULAR_URL =
  process.env.NEXT_PUBLIC_ANGULAR_APP_URL || "http://localhost:4200";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const justRegistered = searchParams.get("registered") === "true";
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<"blocked" | "deactivated" | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  // After registration, show a success message in place of the form for 5s.
  const [showSplash, setShowSplash] = useState(justRegistered);
  // Set when a login attempt is rejected because the email isn't verified yet.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!justRegistered) return;
    const t = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(t);
  }, [justRegistered]);

  // Validation helpers
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const emailRegexTest = (emailStr: string) => emailRegex.test(emailStr);

  const getEmailError = () => {
    if (!touched.email) return "";
    if (!email) return "Email Address is required.";
    if (!emailRegexTest(email)) return "Please enter a valid email address.";
    return "";
  };

  const getPasswordError = () => {
    if (!touched.password) return "";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Minimum length is 6 characters.";
    return "";
  };

  const isLoginFormValid = emailRegexTest(email) && password.length >= 6;

  const handleTabChange = (tab: "signin" | "signup") => {
    setActiveTab(tab);
    if (tab === "signup") router.push("/register");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAccountStatus(null);
    setUnverifiedEmail(null);
    setResendState("idle");
    setTouched({ email: true, password: true });
    if (!isLoginFormValid) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const response = await login({ email, password, rememberMe });
      const role = response?.data?.user?.role;
      const exchangeToken = response?.data?.exchangeToken;
      // const user = response?.data?.user;

      if (role === "student") {
        if (exchangeToken) {
          await verifyExchangeToken({ token: exchangeToken });
        }

        queryClient.invalidateQueries({ queryKey: ["profile"] });
        router.push("/");
        router.refresh();
        return;
      }

      if (role === "instructor") {
        // Instructor → hand off to the Angular dashboard.
        const handoffResponse = await handoffCode();
        const code = handoffResponse?.code;
        if (!code) throw new Error("No handoff code returned");
        window.location.href = `${ANGULAR_URL}/auth/redeem?code=${code}`;
        return;
      }

      // admin / superadmin — this app is for students and instructors only.
      // The backend already minted a session cookie, so revoke it before
      // turning them away toward the admin dashboard.
      await logout().catch(() => { });
      setErrorMessage(
        "Administrator accounts can't sign in here. Please use the admin dashboard.",
      );
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const code = (err as { error?: { code?: string } })?.error?.code;
      const errBody = (err as { error?: Record<string, unknown> })?.error ?? {};

      // Log the full error shape so we can debug detection issues
      // console.error("Login error:", { status, code, errBody, raw: err });

      // Build a single lowercase string from the entire error body
      // to catch the message regardless of where the backend puts it.
      const fullText = JSON.stringify(errBody).toLowerCase() +
        String((err as { message?: string })?.message ?? "").toLowerCase();

      const isBlocked =
        errBody?.isBlocked === true ||
        errBody?.blocked === true ||
        fullText.includes("blocked") ||
        fullText.includes("violating");

      // Only match deactivated if NOT blocked (blocked check has priority)
      const isDeactivated =
        !isBlocked && (
          errBody?.deactivated === true ||
          fullText.includes("deactivated")
        );

      if (status === 403 && code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(email);
      } else if (status === 403 && isBlocked) {
        setAccountStatus("blocked");
      } else if (status === 403 && isDeactivated) {
        setAccountStatus("deactivated");
      } else if (status === 401) {
        setErrorMessage("Invalid email or password.");
      } else if (status === 429) {
        setErrorMessage("Too many login attempts. Please try again in 15 minutes.");
      } else if (!status || status === 0) {
        setErrorMessage("Network error. Please check your connection.");
      } else {
        setErrorMessage("Something went wrong. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail || resendState === "sending") return;
    setResendState("sending");
    try {
      await resendVerification({ email: unverifiedEmail });
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  };

  return (
    <AuthLayout>
      <AuthLogo />
      <AuthCard>
        {showSplash ? (
          <div className="flex flex-col items-center justify-center px-2 py-10 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
              <svg
                className="h-9 w-9 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Account created!</h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">
              We&apos;ve sent a verification link to your email. Verify it, then
              sign in to start learning.
            </p>
            <p className="mt-4 text-xs font-medium text-text-secondary/70">
              The sign-in form will appear in a moment…
            </p>
            <button
              type="button"
              onClick={() => setShowSplash(false)}
              className="mt-5 text-sm font-semibold text-primary hover:underline"
            >
              Sign in now
            </button>
          </div>
        ) : (
          <>
            <div className="auth-card-header">
              <AuthTabs activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            {unverifiedEmail && (
              <div className="auth-warning flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 shadow-sm mb-3 animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 mt-[2px] shrink-0 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="leading-relaxed">
                    Please verify your email before signing in. We sent a link to{" "}
                    <span className="font-semibold break-all">{unverifiedEmail}</span>.
                  </span>
                </div>
                <div className="flex items-center gap-3 pl-6">
                  {resendState === "sent" ? (
                    <span className="text-xs font-semibold text-emerald-600">
                      New verification email sent ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendState === "sending"}
                      className="text-xs font-bold text-primary hover:underline disabled:opacity-60"
                    >
                      {resendState === "sending"
                        ? "Sending…"
                        : "Resend verification email"}
                    </button>
                  )}
                  {resendState === "error" && (
                    <span className="text-xs text-error">
                      Couldn&apos;t send. Try again.
                    </span>
                  )}
                </div>
              </div>
            )}
            {oauthError === "invalid_token" && (
              <div className="auth-error flex items-start gap-2 rounded-lg border border-error bg-error/10 px-3 py-2 text-sm text-error shadow-sm mb-3 animate-in slide-in-from-top-2 fade-in duration-300">
                <svg
                  className="w-4 h-4 mt-[2px] shrink-0 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="leading-relaxed">
                  Google sign-in failed. Please try again.
                </span>
              </div>
            )}
            {/* ── Blocked account ── */}
            {accountStatus === "blocked" && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-3 text-sm text-red-800 shadow-sm mb-3 animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-[2px] shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <div>
                    <p className="font-semibold">Account Blocked</p>
                    <p className="text-red-700 mt-0.5 text-xs leading-relaxed">
                      Your account has been blocked for violating platform policies. Please contact support to appeal.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Deactivated account ── */}
            {accountStatus === "deactivated" && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 shadow-sm mb-3 animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-[2px] shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Account Deactivated</p>
                    <p className="text-amber-700 mt-0.5 text-xs leading-relaxed">
                      Your account has been temporarily deactivated. Please contact support to reactivate it.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Generic errors (wrong password, network, etc.) ── */}
            {errorMessage && (
              <div className="auth-error flex items-start gap-2 rounded-lg border border-error bg-error/10 px-3 py-2 text-sm text-error shadow-sm mb-3 animate-in slide-in-from-top-2 fade-in duration-300">
                <svg
                  className="w-4 h-4 mt-[2px] shrink-0 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="auth-card-form space-y-1 sm:space-y-1.5"
            >
              <div className="auth-step-region space-y-1 sm:space-y-1.5">
                <AuthInput
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  required
                  error={getEmailError()}
                  showSuccess={
                    touched.email && email.length > 0 && emailRegexTest(email)
                  }
                  icon={
                    <svg
                      className="h-5 w-5 text-text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  }
                />
                <PasswordInput
                  id="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  required
                  error={getPasswordError()}
                />
                <div className="flex items-center justify-between gap-3">
                  <RememberMe checked={rememberMe} onChange={setRememberMe} />
                  <Link
                    href="/forgot-password"
                    className="whitespace-nowrap text-sm font-medium text-[#3B1892] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div className="auth-card-actions">
                <AuthButton
                  type="submit"
                  loading={isLoading}
                  disabled={!isLoginFormValid}
                >
                  Sign In
                </AuthButton>
              </div>
            </form>

            <div className="auth-card-social mt-3">
              <AuthDivider>or continue with </AuthDivider>
              <div className="mt-3">
                <SocialLogin onGoogle={() => redirectToGoogleAuth()} />
              </div>
            </div>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}