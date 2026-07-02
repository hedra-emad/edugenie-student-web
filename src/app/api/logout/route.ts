export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';
  // Clear the first-party cookies using the SAME attributes they were set with
  // (HttpOnly, SameSite=Lax, Secure only in prod, and each cookie's own Path)
  // so they reliably clear. The refresh cookie is scoped to the proxy's auth
  // path — a deletion cookie only needs a matching name+Path, not the value.
  const expire = (name: string, path: string) =>
    [
      `${name}=`,
      `Path=${path}`,
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'Max-Age=0',
      'HttpOnly',
      isProd ? 'Secure' : '',
      'SameSite=Lax',
    ]
      .filter(Boolean)
      .join('; ');

  const res = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  res.headers.append('Set-Cookie', expire('jwt', '/'));
  res.headers.append('Set-Cookie', expire('refreshToken', '/api/proxy/auth'));
  return res;
}
