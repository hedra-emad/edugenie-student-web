import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, params);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, params);
}

async function handleRequest(req: NextRequest, params: Promise<{ path: string[] }>) {
  const resolvedParams = await params;
  const targetUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://edugenie-api.vercel.app"}/${resolvedParams.path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host"); // Let fetch set the correct host

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      redirect: "manual",
      // Only include body for methods that allow it
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
    };

    const backendResponse = await fetch(targetUrl, fetchOptions);

    const responseHeaders = new Headers(backendResponse.headers);

    // Remove headers related to the original compressed body size and encoding
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");

    // Fix Set-Cookie domain issue for localhost
    const setCookieHeaders = backendResponse.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      responseHeaders.delete("set-cookie");
      for (const cookie of setCookieHeaders) {
        // Strip Domain, Secure, and swap SameSite=none to Lax
        let fixedCookie = cookie.replace(/Domain=[^;]+;?\s*/i, "");
        if (process.env.NODE_ENV === "development") {
          fixedCookie = fixedCookie.replace(/Secure;?\s*/i, "");
          fixedCookie = fixedCookie.replace(/SameSite=none/i, "SameSite=Lax");
        }
        responseHeaders.append("set-cookie", fixedCookie);
      }
    }

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Proxy Error", details: error.message }, { status: 500 });
  }
}
