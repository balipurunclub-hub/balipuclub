import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CANONICAL_HOST = 'balipuclub.in';

/**
 * Permanent-redirect every *.vercel.app request to https://balipuclub.in
 * so Google consolidates rankings onto the custom domain.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase().split(':')[0] ?? '';

  if (host.endsWith('.vercel.app')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.hostname = CANONICAL_HOST;
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml)$).*)',
  ],
};
