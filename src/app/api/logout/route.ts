export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';
  // Clear the first-party cookie using the SAME attributes it was set with
  // (Path=/, HttpOnly, SameSite=Lax, Secure only in prod) so it reliably clears.
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': [
        'jwt=',
        'Path=/',
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'Max-Age=0',
        'HttpOnly',
        isProd ? 'Secure' : '',
        'SameSite=Lax',
      ]
        .filter(Boolean)
        .join('; '),
    },
  });
}