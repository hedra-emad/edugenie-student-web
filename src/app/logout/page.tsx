"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleLogout() {
      try {
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        });
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