import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OnboardingClient from "./_components/OnboardingClient";

export const metadata: Metadata = {
  title: "Welcome to EduGenie — Set up your learning",
};

export default async function OnboardingPage() {
  const store = await cookies();
  if (!store.get("jwt")?.value) redirect("/login?next=/onboarding");
  return <OnboardingClient />;
}
