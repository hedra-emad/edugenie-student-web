"use client";

import { useEffect } from "react";
import { resolveApiBase } from "@/lib/apiBase";

// Direct (browser → API) base so we can clear the API-domain cookie too.
const API_BASE = resolveApiBase(
  process.env.NEXT_PUBLIC_API_URL || "https://edugenie-api.vercel.app",
);

export default function LogoutPage() {
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

      // Full-document navigation (NOT router.push): the header and session are
      // server components derived from the `jwt` cookie. A soft nav would keep
      // the stale "logged-in" UI — and leave the login link non-functional —
      // until a manual refresh. A hard load re-runs SSR with the now-cleared
      // cookies and resets all client caches.
      if (isMounted) window.location.replace("/");
    }

    handleLogout();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Signing you out...</p>
      </div>
    </div>
  );
}
