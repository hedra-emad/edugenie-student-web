// src/components/layout/HeaderServer.tsx
import { cookies } from "next/headers";
import { decodeJwt } from "@/lib/decode-jwt";
import Header from "./Header";

export default async function HeaderServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;
  const payload = token ? decodeJwt(token) : null;
  const isStudent = payload?.role === "student";

  const displayName =
    payload?.firstName && payload?.lastName
      ? `${payload.firstName} ${payload.lastName}`
      : (payload?.firstName as string | undefined) ?? null;

  return <Header isStudent={isStudent} displayName={displayName} />;
}