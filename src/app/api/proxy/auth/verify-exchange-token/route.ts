import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const backendRes = await fetch(`${backendUrl}/auth/verify-exchange-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!backendRes.ok) {
      return NextResponse.json({ error: "Verification failed" }, { status: backendRes.status });
    }

    const responseBody = await backendRes.json();

    console.log("Backend response:", JSON.stringify(responseBody, null, 2));

    // 1. Try to get it from the JSON body (if backend sends it there)
    let jwt: string =
      responseBody.data?.token ??
      responseBody.data?.accessToken ??
      responseBody.data?.jwt;

    // 2. If it's not in the body, extract it from the Set-Cookie header
    if (!jwt) {
      const setCookieHeader = backendRes.headers.get("set-cookie");
      if (setCookieHeader) {
        // Our backend sets the cookie as 'jwt=eyJ...'
        const match = setCookieHeader.match(/(?:^|;\s*)jwt=([^;]+)/i);
        jwt = match?.[1] ?? "";
      }
    }

    if (!jwt) {
      return NextResponse.json({ error: "No token found in response" }, { status: 500 });
    }

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set("jwt", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 1 day
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Proxy auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
