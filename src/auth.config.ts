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
        '/pricing',
        '/search',
      ];

      const isPublicPath = publicPaths.some(path => nextUrl.pathname.startsWith(path));
      const isApiRoute = nextUrl.pathname.startsWith('/api/');
      const isPublicApi = [
        '/api/permit-offices',
        '/api/geocode',
        '/api/webhooks/stripe',
        '/api/auth',
      ].some(path => nextUrl.pathname.startsWith(path));

      if (isPublicPath || (isApiRoute && isPublicApi)) {
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
