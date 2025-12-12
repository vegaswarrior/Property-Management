import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

export const authConfig = {
  providers: [], // Required by NextAuthConfig type
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const host = request.headers.get('host') || '';

      // Check if this is a subdomain request by examining the host header
      // This runs BEFORE middleware rewrite, so we check the original host
      const isSubdomain = (() => {
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'rooms4rentlv.com';
        const bareHost = host.split(':')[0].toLowerCase();
        
        // Handle localhost subdomains (e.g., subdomain.localhost:3000)
        if (bareHost.includes('localhost')) {
          const parts = bareHost.split('.');
          // If it's a subdomain like "subdomain.localhost", it's a subdomain
          return parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== 'www';
        }
        
        // Handle production subdomains (e.g., subdomain.rooms4rentlv.com)
        return bareHost !== rootDomain && 
               bareHost.endsWith(`.${rootDomain}`) && 
               !bareHost.startsWith('www.');
      })();

      // CRITICAL: If it's a subdomain request, ALWAYS allow it through
      // Subdomain pages handle their own authentication
      // This prevents NextAuth from blocking public subdomain pages
      if (isSubdomain) {
        return true; // Always allow subdomain routes
      }

      // Main domain protected paths only
      const protectedPaths = [
        /^\/shipping-address/,
        /^\/place-order/,
        /^\/profile$/,
        /^\/user\/(?!sign-in|sign-up|dashboard).*/,  // User routes except public ones
        /^\/order\//,
        /^\/admin(?!\/sign-in|\/sign-up).*/,  // Admin routes except sign-in/sign-up
        /^\/super-admin/,
      ];

      // For main domain, check protected paths
      const isProtected = protectedPaths.some((p) => p.test(pathname));
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.config.ts:48',message:'Route authorization check',data:{pathname,host,isSubdomain,hasAuth:!!auth,isProtected},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (!auth && isProtected) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/57411b46-b040-413d-9d84-cfa7fc7db9cd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.config.ts:50',message:'Route blocked - unauthorized',data:{pathname,host},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        return false;
      }

      if (!request.cookies.get('sessionCartId')) {
        const sessionCartId = crypto.randomUUID();

        const response = NextResponse.next({
          request: {
            headers: new Headers(request.headers),
          },
        });

        response.cookies.set('sessionCartId', sessionCartId);

        return response;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
