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

  const failures = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) =>
      r.reason instanceof Error
        ? r.reason.message
        : "Failed to add item to cart",
    );

  // "Already in cart" / "already own" / duplicate-key are not real failures —
  // the item is already accounted for, so don't block the flow over them.
  const hardFailures = failures.filter((m) => !/already|duplicate/i.test(m));

  if (hardFailures.length > 0) {
    return { success: false, error: hardFailures[0] };
  }

  return { success: true };
}

/**
 * Server Action — POST /cart/course/:courseId
 * One-click smart add: the backend adds only the sections the student doesn't
 * already own (or the full course if they own nothing) and prices them so the
 * student pays only the remaining balance. "Already owned" is not a real error.
 */
export async function addCourseToCartSmart(
  courseId: string,
): Promise<CartActionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value ?? null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/cart/course/${courseId}`, {
    method: "POST",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      (err as { message?: string }).message ?? `Request failed: ${res.status}`;
    if (/already|duplicate/i.test(message)) return { success: true };
    return { success: false, error: message };
  }

  return { success: true };
}
