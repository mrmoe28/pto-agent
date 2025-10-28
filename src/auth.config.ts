import type { NextAuthConfig } from 'next-auth';

// Edge-compatible auth configuration (no database or Node.js modules)
export const authConfig = {
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const publicPaths = [
        '/',
        '/sign-in',
        '/sign-up',
        '/forgot-password',
        '/reset-password',
        '/pricing',
        '/search',
      ];

      const isPublicPath = publicPaths.some(path => nextUrl.pathname.startsWith(path));
      const isApiRoute = nextUrl.pathname.startsWith('/api/');
      const isPublicApi = [
        '/api/permit-offices',
        '/api/geocode',
        '/api/webhooks/stripe',
        '/api/webhooks/square',
        '/api/auth',
      ].some(path => nextUrl.pathname.startsWith(path));

      // Allow public paths and public API routes
      if (isPublicPath || (isApiRoute && isPublicApi)) {
        return true;
      }

      // Redirect to sign-in if not logged in
      if (!isLoggedIn) {
        const signInUrl = new URL('/sign-in', nextUrl.origin);
        signInUrl.searchParams.set('callbackUrl', nextUrl.pathname);
        return Response.redirect(signInUrl);
      }

      return true;
    },
  },
  providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
