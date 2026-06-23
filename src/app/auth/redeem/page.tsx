"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { redeemCode } from "@/lib/api/auth";

function RedeemLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleRedeem() {
      if (!code) {
        if (isMounted) router.push("/login");
        return;
      }

      try {
        await redeemCode({ code });
        if (isMounted) router.push("/");
      } catch (err: any) {
        console.error("Redeem error:", err);
        if (isMounted) router.push("/login?error=Session+link+expired,+please+log+in+again");
      }
    }

    handleRedeem();

    return () => {
      isMounted = false;
    };
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        {/* Simple spinner */}
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Signing you in...</p>
      </div>
    </div>
  );
}

export default function RedeemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Signing you in...</p>
        </div>
      </div>
    }>
      <RedeemLogic />
    </Suspense>
  );
}
