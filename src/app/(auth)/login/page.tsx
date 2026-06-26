"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { login, verifyExchangeToken, handoffCode } from "@/lib/api/auth";
import { useQueryClient } from "@tanstack/react-query";

const ANGULAR_URL =
  process.env.NEXT_PUBLIC_ANGULAR_APP_URL || "http://localhost:4200";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleTabChange = (tab: "signin" | "signup") => {
    setActiveTab(tab);
    if (tab === "signup") router.push("/register");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await login({ email, password, rememberMe });
      const role = response?.data?.user?.role;
      const exchangeToken = response?.data?.exchangeToken;
      const user = response?.data?.user;

      if (role === "student") {
        if (exchangeToken) {
          await verifyExchangeToken({ token: exchangeToken });
        }

        // ← حط الاسم في cookie عادية عشان HeaderServer يقدر يقراها
        if (user?.firstName) {
          const displayName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ");
          document.cookie = `displayName=${encodeURIComponent(displayName)}; path=/; max-age=86400; SameSite=Lax`;
        }

        queryClient.invalidateQueries({ queryKey: ["profile"] });
        router.push("/");
        router.refresh();
        return;
      }

      // Non-student → Angular dashboard
      const handoffResponse = await handoffCode();
      const code = handoffResponse?.code;
      if (!code) throw new Error("No handoff code returned");
      window.location.href = `${ANGULAR_URL}/auth/redeem?code=${code}`;
    } catch (err: unknown) {
      console.error("Login error:", err);
      const status = (err as { status?: number })?.status;

      if (status === 401) {
        setErrorMessage("Invalid email or password");
      } else if (status === 429) {
        setErrorMessage(
          "Too many login attempts. Please try again in 15 minutes.",
        );
      } else if (!status || status === 0) {
        setErrorMessage("Network error. Please check your connection");
      } else {
        setErrorMessage("Something went wrong. Please try again later");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthLogo />
      <AuthCard>
        <div className="auth-card-header">
          <AuthTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {errorMessage && (
          <div className="auth-error flex items-start gap-2 rounded-xl border border-error bg-error/10 px-3 py-2 text-sm text-error shadow-sm mb-4 animate-in slide-in-from-top-2 fade-in duration-300">
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
          className="auth-card-form space-y-2 sm:space-y-3"
        >
          <div className="auth-step-region space-y-2 sm:space-y-3">
            <AuthInput
              id="email"
              type="email"
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              showSuccess={email.length > 5 && email.includes("@")}
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
              required
            />
            <RememberMe checked={rememberMe} onChange={setRememberMe} />
          </div>

          <div className="auth-card-actions mt-2">
            <AuthButton
              type="submit"
              loading={isLoading}
              disabled={!email || !password}
            >
              Sign In
            </AuthButton>
          </div>
        </form>

        <div className="auth-card-social mt-4">
          <AuthDivider>or continue with</AuthDivider>
          <div className="mt-4">
            <SocialLogin
              onGoogle={() => {}}
              onGithub={() => {}}
            />
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
