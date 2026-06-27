export interface JwtPayload {
  id: string;
  role: string;
  firstName?: string;
  lastName?: string;
  iat: number;
  exp: number;
}
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;

    // Convert base64url → standard base64, then add padding.
    // Uses atob() (Web API) so it works in both Edge Runtime (middleware)
    // and Node.js (Server Components / Server Actions).
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
