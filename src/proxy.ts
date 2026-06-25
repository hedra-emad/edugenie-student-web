import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "@/lib/decode-jwt";

const STUDENT_ONLY_PATHS = ["/cart", "/checkout"];
const PUBLIC_AUTH_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const token = request.cookies.get("jwt")?.value;
  const { pathname } = request.nextUrl;

  if (!token) {
    if (STUDENT_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const payload = decodeJwt(token);

  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Non-student trying to access student-facing pages → send to dashboard
  if (payload.role !== "student") {
    if (
      STUDENT_ONLY_PATHS.some((p) => pathname.startsWith(p)) ||
      PUBLIC_AUTH_PATHS.some((p) => pathname.startsWith(p))
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Student trying to access login/register → send home
  if (
    payload.role === "student" &&
    PUBLIC_AUTH_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cart/:path*", "/checkout/:path*", "/login", "/register"],
};