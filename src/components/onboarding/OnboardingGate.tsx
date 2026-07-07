"use client";
// Mandatory one-time onboarding gate. Any email-verified student who has NOT
// completed onboarding is forced to /onboarding before reaching the rest of the
// platform. Reads status from GET /onboarding (the JWT payload carries no
// verification/onboarding claim, so it must be fetched). Renders nothing.

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/providers/SessionProvider";
import { getOnboardingStatus } from "@/lib/api/onboarding";

// Routes that must stay reachable without onboarding (auth handshakes + the
// onboarding flow itself), so the gate never traps or loops the user.
const EXEMPT_PREFIXES = [
  "/onboarding",
  "/login",
  "/register",
  "/verify-email",
  "/auth-callback",
  "/auth/redeem",
  "/forgot-password",
  "/reset-password",
];

export default function OnboardingGate() {
  const { isAuthenticated } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const exempt = EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));

  const { data } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: getOnboardingStatus,
    enabled: isAuthenticated && !exempt,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (exempt || !data) return;
    if (data.isVerified && !data.hasOnboarded) {
      router.replace("/onboarding");
    }
  }, [data, exempt, router]);

  return null;
}
