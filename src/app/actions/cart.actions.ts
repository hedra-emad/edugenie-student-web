"use server";

import { cookies } from "next/headers";
import { resolveApiBase } from "@/lib/apiBase";

const REMOTE_API =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edugenie-api.vercel.app";
const API_URL = resolveApiBase(REMOTE_API);

export interface CartPayload {
  courseId: string;
  sectionId?: string;
  type: "full_course" | "section";
}

export interface CartActionResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action — POST /cart
 * Accepts one or more cart payloads.
 * Token is read directly from cookies() on the server.
 */
export async function addToCartAction(
  payloads: CartPayload | CartPayload[],
): Promise<CartActionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value ?? null;

  const items = Array.isArray(payloads) ? payloads : [payloads];

  const results = await Promise.allSettled(
    items.map(async (payload) => {
      const body: Record<string, string> = {
        type: payload.type,
        courseId: payload.courseId,
      };
      if (payload.sectionId) body.sectionId = payload.sectionId;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ??
            `Request failed: ${res.status}`,
        );
      }

      return res.json();
    }),
  );

  const failed = results.filter((r) => r.status === "rejected");

  if (failed.length > 0) {
    const firstError = failed[0] as PromiseRejectedResult;
    return {
      success: false,
      error:
        firstError.reason instanceof Error
          ? firstError.reason.message
          : "Failed to add item to cart",
    };
  }

  return { success: true };
}
