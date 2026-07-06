import { resolveApiBase } from "@/lib/apiBase";

export interface Certificate {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issuedAt: string;
  courseId: string;
}

export interface CertificateVerification {
  valid: boolean;
  studentName?: string;
  courseTitle?: string;
  instructorName?: string;
  certificateNumber?: string;
  issuedAt?: string;
}

function browserBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE ?? "/api/proxy";
}

// SSR hits the backend directly, which serves every route under `/api`
// (global prefix) — NEXT_PUBLIC_API_URL usually omits it, so normalize.
function serverBase(): string {
  return resolveApiBase(process.env.NEXT_PUBLIC_API_URL ?? "");
}

/** Browser: list the signed-in student's certificates (through the BFF proxy). */
export async function fetchMyCertificates(): Promise<Certificate[]> {
  const res = await fetch(`${browserBase()}/certificates`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

/** Server: fetch one certificate for the owner (needs the jwt for Authorization). */
export async function fetchCertificateById(
  id: string,
  token: string,
): Promise<Certificate | null> {
  const res = await fetch(`${serverBase()}/certificates/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return (json?.data ?? json) as Certificate;
}

/** Server/public: verify a certificate by its code (no auth). */
export async function verifyCertificate(
  code: string,
): Promise<CertificateVerification> {
  const res = await fetch(`${serverBase()}/certificates/verify/${code}`, {
    cache: "no-store",
  });
  if (!res.ok) return { valid: false };
  const json = await res.json();
  return (json?.data ?? json) as CertificateVerification;
}
