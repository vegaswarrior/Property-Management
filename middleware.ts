import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const url = req.nextUrl.clone();

  // Skip middleware for API routes and static files
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/_next/') ||
      url.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Handle subdomain routing
  const subdomain = getSubdomain(host);

  if (subdomain) {
    // Add subdomain to headers so pages can access it
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-subdomain', subdomain);

    // Determine if path should be handled by subdomain storefront
    const path = url.pathname;
    const isProtectedOrAuthPath =
      path.startsWith('/admin') ||
      path.startsWith('/user') ||
      path.startsWith('/super-admin') ||
      path.startsWith('/onboarding') ||
      path.startsWith('/sign-in') ||
      path.startsWith('/sign-up') ||
      path.startsWith('/verify-email') ||
      path.startsWith('/forgot-password') ||
      path.startsWith('/reset-password');

    if (!isProtectedOrAuthPath) {
      // Rewrite to the dynamic route with subdomain context for public/storefront paths only
      // The [subdomain] folder structure expects paths like /[subdomain]/... for public pages
      url.pathname = `/${subdomain}${url.pathname}`;

      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    }
    // For protected/auth paths, do not rewrite; let main domain handle them
  }

  return NextResponse.next();
}

function getSubdomain(host: string): string | null {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'rooms4rentlv.com';
  const bareHost = host.split(':')[0].toLowerCase();

  // Handle localhost subdomains (e.g., ilovegod.localhost:3000)
  if (bareHost.includes('localhost')) {
    const parts = bareHost.split('.');
    // If it's a subdomain like "subdomain.localhost", extract the subdomain
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== 'www') {
      return parts[0];
    }
    // If it's just "localhost", return null (main domain)
    return null;
  }

  // Handle production subdomains (e.g., subdomain.rooms4rentlv.com)
  if (bareHost === rootDomain) {
    return null; // Main domain
  }

  if (bareHost.endsWith(`.${rootDomain}`)) {
    const subdomain = bareHost.slice(0, bareHost.length - rootDomain.length - 1);
    // Skip www subdomain
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }

  return null;
}
