"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      // Fallback to local Angular dashboard URL if environment variable is missing
      const dashboardUrl =
        process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:4200";

      if (!token) {
        window.location.href = `${dashboardUrl}/login?error=invalid_token`;
        return;
      }

      try {
        const response = await fetch("/api/proxy/auth/verify-exchange-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          credentials: "include", // Ensures the returned HTTP-only cookie is set on the domain
        });

        if (response.ok) {
          // Token verified successfully and HTTP-only cookie is set
          // router.replace("/"); // Redirect to the student home/dashboard page
          router.replace(dashboardUrl);
        } else {
          // Verification failed (invalid or expired token)
          window.location.href = `${dashboardUrl}/login?error=invalid_token`;
        }
      } catch (err) {
        console.error("Verification error:", err);
        window.location.href = `${dashboardUrl}/login?error=auth_failed`;
      }
    };

    verifyToken();
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
