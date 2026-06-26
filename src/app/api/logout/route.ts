export async function GET() {
  const NEXTJS_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://edugenie-student-web.vercel.app';

  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${NEXTJS_URL}/" />
      </head>
      <body>Logging out...</body>
    </html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': [
          'jwt=',
          'Path=/',
          'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          'Max-Age=0',
          'HttpOnly',
          'Secure',
          'SameSite=None',
        ].join('; '),
      },
    }
  );
}

export async function POST() {
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
        'Secure',
        'SameSite=None',
      ].join('; '),
    },
  });
}