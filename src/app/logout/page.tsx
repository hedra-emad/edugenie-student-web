"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveApiBase } from "@/lib/apiBase";

// Direct (browser → API) base so we can clear the API-domain cookie too.
const API_BASE = resolveApiBase(
  process.env.NEXT_PUBLIC_API_URL || "https://edugenie-api.vercel.app",
);

export default function LogoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleLogout() {
      // Clear BOTH cookies:
      //  1) the student-web first-party cookie (via the local route)
      //  2) the API-domain cookie used by the dashboard — only a direct
      //     browser→API call can clear a cookie on that domain.
      await Promise.allSettled([
        fetch("/api/logout", { method: "POST", credentials: "include" }),
        fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          credentials: "include",
        }),
      ]);
      try {
        if (isMounted) router.push("/");
      } catch (err) {
        console.error("Logout error:", err);
        if (isMounted) router.push("/");
      }
    }

    handleLogout();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Signing you out...</p>
      </div>
    </div>
  );
}