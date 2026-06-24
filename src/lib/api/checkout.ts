// src/lib/api/checkout.ts
import type { Cart, CheckoutResponse, Order } from "@/types/checkout";

const REMOTE_API =
  process.env.NEXT_PUBLIC_API_URL ?? "https://edugenie-api.vercel.app";

function baseUrl(): string {
  return typeof window === "undefined" ? REMOTE_API : "/api/proxy";
}

export async function getCart(token?: string): Promise<Cart | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl()}/cart`, {
      headers,
      credentials: token ? undefined : "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return normalizeCart(await res.json());
  } catch {
    return null;
  }
}

export async function addToCart(
  type: "full_course" | "section",
  courseId: string,
  sectionId?: string,
): Promise<Cart | null> {
  try {
    const body: Record<string, string> = { type, courseId };
    if (sectionId) body.sectionId = sectionId;
    const res = await fetch(`${baseUrl()}/cart`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return normalizeCart(await res.json());
  } catch {
    return null;
  }
}

export async function removeFromCart(itemId: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl()}/cart/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function initiateCheckout(): Promise<CheckoutResponse | null> {
  try {
    const res = await fetch(`${baseUrl()}/orders/checkout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    return normalizeCheckoutResponse(await res.json());
  } catch {
    return null;
  }
}

// موقت
// export async function initiateCheckout(): Promise<CheckoutResponse | null> {
//   try {
//     const token = document.cookie
//       .split("; ")
//       .find((row) => row.startsWith("access_token="))
//       ?.split("=")[1];

//     console.log("token found:", token ? token.slice(0, 20) : "NONE");

//     const res = await fetch("https://edugenie-api.vercel.app/orders/checkout", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       },
//       body: JSON.stringify({}),
//     });

//     console.log("checkout status:", res.status);
//     const json = await res.json();
//     console.log("checkout response:", JSON.stringify(json));

//     if (!res.ok) return null;
//     return normalizeCheckoutResponse(json);
//   } catch (e) {
//     console.log("checkout error:", e);
//     return null;
//   }
// }


// ---------------------------------------------
export async function getOrder(
  orderId: string,
  token?: string,
): Promise<Order | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl()}/orders/${encodeURIComponent(orderId)}`, {
      headers,
      credentials: token ? undefined : "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return normalizeOrder(await res.json());
  } catch {
    return null;
  }
}

export async function getOrderHistory(token?: string): Promise<Order[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl()}/orders/my`, {
      headers,
      credentials: token ? undefined : "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    const raw =
      asRecord(json)?.orders ??
      asRecord(json)?.data ??
      (Array.isArray(json) ? json : []);
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeOrder).filter((o): o is Order => o !== null);
  } catch {
    return [];
  }
}

// ─── Normalization helpers ────────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeCart(json: unknown): Cart | null {
  const raw = asRecord(json);
  if (!raw) return null;
  const data = asRecord(raw.cart) ?? asRecord(raw.data) ?? raw;
  const itemsRaw = Array.isArray(data.items)
    ? data.items
    : Array.isArray(raw.items)
      ? raw.items
      : [];
  const items = (itemsRaw as unknown[])
    .map((i) => {
      const item = asRecord(i);
      if (!item) return null;
      const type = item.type === "section" ? "section" : "full_course";
      return {
        _id: String(item._id ?? item.id ?? ""),
        type: type as "full_course" | "section",
        courseId: String(item.courseId ?? ""),
        courseTitle: String(item.courseTitle ?? item.title ?? ""),
        thumbnail: String(item.thumbnail ?? ""),
        instructorName: String(item.instructorName ?? ""),
        sectionId: typeof item.sectionId === "string" ? item.sectionId : undefined,
        sectionTitle: typeof item.sectionTitle === "string" ? item.sectionTitle : undefined,
        price: typeof item.price === "number" ? item.price : 0,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);
  return {
    items,
    subtotal:
      typeof data.subtotal === "number"
        ? data.subtotal
        : typeof raw.subtotal === "number"
          ? raw.subtotal
          : 0,
    total:
      typeof data.total === "number"
        ? data.total
        : typeof raw.total === "number"
          ? raw.total
          : 0,
  };
}

function normalizeCheckoutResponse(json: unknown): CheckoutResponse | null {
  const raw = asRecord(json);
  if (!raw) return null;
  const data = asRecord(raw.data) ?? raw;
  const clientSecret =
    typeof data.clientSecret === "string"
      ? data.clientSecret
      : typeof raw.clientSecret === "string"
        ? raw.clientSecret
        : "";
  if (!clientSecret) return null;
  return {
    success: Boolean(data.success ?? raw.success ?? true),
    clientSecret,
    orderId: String(data.orderId ?? raw.orderId ?? ""),
    amount: typeof data.amount === "number" ? data.amount : 0,
    currency: typeof data.currency === "string" ? data.currency : "EGP",
  };
}

function normalizeOrder(json: unknown): Order | null {
  const raw = asRecord(json);
  if (!raw) return null;
  const data = asRecord(raw.order) ?? asRecord(raw.data) ?? raw;
  const orderId = String(data.orderId ?? data._id ?? data.id ?? "");
  if (!orderId) return null;
  const statusRaw = String(data.status ?? "PENDING").toUpperCase();
  const status: Order["status"] =
    statusRaw === "COMPLETED" ? "COMPLETED" : statusRaw === "FAILED" ? "FAILED" : "PENDING";
  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  const items = (itemsRaw as unknown[])
    .map((i) => {
      const item = asRecord(i);
      if (!item) return null;
      const type = item.type === "section" ? "section" : "full_course";
      return {
        courseTitle: String(item.courseTitle ?? item.title ?? ""),
        type: type as "full_course" | "section",
        sectionTitle: typeof item.sectionTitle === "string" ? item.sectionTitle : undefined,
        price: typeof item.price === "number" ? item.price : 0,
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null);
  return {
    orderId,
    status,
    items,
    total: typeof data.total === "number" ? data.total : 0,
    paidAt: typeof data.paidAt === "string" ? data.paidAt : undefined,
    createdAt:
      typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
  };
}
