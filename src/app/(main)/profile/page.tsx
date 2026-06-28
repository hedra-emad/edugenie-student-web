import { cookies } from "next/headers";
import { fetchProfile } from "@/lib/api/profile.api";
import ProfileClient from "@/components/profile/ProfileClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your Profile — EduGenie" };

export default async function ProfilePage() {
  const store = await cookies();
  const token = store.get("jwt")?.value ?? "";
  const profile = await fetchProfile(token);
  return <ProfileClient initialProfile={profile.data} token={token} />;
}