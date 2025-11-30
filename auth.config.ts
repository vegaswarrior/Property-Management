import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

export const authConfig = {
  providers: [], // Required by NextAuthConfig type
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;

      const protectedPaths = [
        /\/shipping-address/,
        /\/place-order/,
        /\/profile/,
        /\/user\/(.*)/,
        /\/order\/(.*)/,
        /\/admin/,
        /\/super-admin/,
      ];

      if (!auth && protectedPaths.some((p) => p.test(pathname))) return false;

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
