import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Hands the session JWT to the authenticated browser so it can open the AI
 * tutor WebSocket.
 *
 * The JWT normally lives in an httpOnly cookie that client JS can't read, and
 * the AI gateway runs on a DIFFERENT origin (an always-on host, not Vercel) —
 * so the browser can't rely on the cookie travelling cross-site. This route
 * runs server-side, reads the cookie, and returns the token only to a request
 * that already carries it. The token is the same short-lived session JWT; it is
 * never persisted client-side (the chat hook keeps it in memory for the
 * handshake only).
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Not authenticated" },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { token },
    {
      // Never cache an auth token.
      headers: { "Cache-Control": "no-store" },
    },
  );
}
