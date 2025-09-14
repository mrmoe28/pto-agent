import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';
import { users, accounts, sessions, verificationTokens, userProfiles } from './db/schema';
// import { eq } from 'drizzle-orm'; // Unused for now

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Add any custom sign-in logic here if needed
      console.log('User signing in:', user.email);
      return true;
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ user, token }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      // Create user profile when user signs in for the first time
      if (isNewUser && user.id) {
        try {
          await db.insert(userProfiles).values({
            userId: user.id,
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            preferences: {
              notifications: true,
              theme: 'light',
              emailUpdates: false,
            },
          });
        } catch (error) {
          console.error('Error creating user profile:', error);
        }
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};