"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { verifyExchangeToken, logout } from "@/lib/api/auth";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get("token");

      // The dashboard login URL (env that actually exists), used for error
      // fallbacks since this app cannot recover a failed handoff itself.
      const dashboardUrl =
        process.env.NEXT_PUBLIC_ANGULAR_APP_URL ||
        "https://edugenie-dashboard.vercel.app";

      if (!token) {
        window.location.href = `${dashboardUrl}/login?error=invalid_token`;
        return;
      }

      try {
        // Goes through /api/proxy so the backend's Set-Cookie is rewritten as a
        // first-party HttpOnly cookie on this (student-web) domain.
        const result = await verifyExchangeToken({ token });

        // This app is for students and instructors only. If an admin account
        // arrives here (e.g. via "Continue with Google"), revoke the session
        // that was just minted and send them to the admin dashboard instead.
        const role = result?.data?.user?.role;
        if (role === "admin" || role === "superadmin") {
          await logout().catch(() => {});
          window.location.href = `${dashboardUrl}/admin-login?error=use_dashboard`;
          return;
        }

        // Land the student on their home page.
        router.replace("/");
        router.refresh();
      } catch (err) {
        console.error("Verification error:", err);
        const errorMessage = (err as any)?.message || "Authentication failed";
        const isNetworkError =
          errorMessage.includes("ECONNRESET") ||
          errorMessage.includes("ECONNREFUSED") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("AbortError");

        if (isNetworkError) {
          // Transient connection error - show a more helpful message
          window.location.href = `${dashboardUrl}/login?error=connection_error`;
        } else {
          window.location.href = `${dashboardUrl}/login?error=invalid_token`;
        }
      }
    };

    run();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-[#2e2a91] animate-spin mb-4" />
      <h2 className="text-2xl font-bold text-gray-800">
        Authenticating...
      </h2>
      <p className="text-gray-500 mt-2 text-center max-w-sm">
        Please wait while we securely log you in. You will be redirected shortly.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-[#2e2a91] animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
