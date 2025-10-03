# Auth.js Migration Guide - Clerk to NextAuth v5

## Migration Status: IN PROGRESS

### ✅ Completed Steps:

1. **Packages Updated**
   - ✅ Removed `@clerk/nextjs`
   - ✅ Installed `next-auth@5.0.0-beta.25`
   - ✅ Installed `@auth/prisma-adapter@2.8.0`
   - ✅ Installed `bcrypt@5.1.1` and `@types/bcrypt@5.0.2`

2. **Database Schema Updated**
   - ✅ Added Auth.js tables: `users`, `accounts`, `sessions`, `verificationTokens`
   - ✅ Updated all foreign key references from Clerk to Auth.js
   - ✅ All user ID fields now reference `users.id` with proper cascade rules

3. **Environment Variables**
   - ✅ Generated AUTH_SECRET: `7bf6332effa1725ac32b74850cb96fb1675468e26266fa316bba079d3c4a4081`
   - ⚠️ Need to update `.env.local` with new Auth.js variables

---

## 🚧 Remaining Tasks:

### PHASE 1: Core Auth Configuration

#### 1. Create `auth.ts` configuration file
**Location:** `/src/auth.ts` (project root)

```typescript
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import bcrypt from 'bcrypt';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/sign-in',
    signUp: '/sign-up',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, credentials.email as string),
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
```

#### 2. Create Auth.js API Route Handler
**Location:** `/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

#### 3. Update `.env.local`
```bash
# Remove these Clerk variables:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# CLERK_SECRET_KEY
# CLERK_JWKS_URL
# NEXT_PUBLIC_CLERK_SIGN_IN_URL
# NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
# NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL

# Add these Auth.js variables:
AUTH_SECRET=7bf6332effa1725ac32b74850cb96fb1675468e26266fa316bba079d3c4a4081
NEXTAUTH_URL=http://localhost:3000

# Keep existing Stripe, Database, and Google API variables
```

---

### PHASE 2: Update Core Files

#### 4. Update `src/app/layout.tsx`
**Current:** Uses `ClerkProvider`
**Replace with:**

```typescript
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <Navigation />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

#### 5. Update `src/middleware.ts`
**Current:** Uses `clerkMiddleware`
**Replace with:**

```typescript
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/pricing',
    '/search',
    '/api/permit-offices',
    '/api/geocode',
    '/api/webhooks/stripe',
    '/api/auth',
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isPublicRoute && !req.auth) {
    const newUrl = new URL('/sign-in', req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

---

### PHASE 3: Authentication Pages

#### 6. Create Sign-In Page
**Location:** `/src/app/sign-in/page.tsx`

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 7. Create Sign-Up Page
**Location:** `/src/app/sign-up/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import bcrypt from 'bcryptjs'; // Use bcryptjs for client-side
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create user via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Registration failed');
        return;
      }

      // Sign in after successful registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Registration successful but sign-in failed');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 8. Create Registration API Route
**Location:** `/src/app/api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    }).returning();

    return NextResponse.json(
      { user: { id: newUser.id, email: newUser.email, name: newUser.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### PHASE 4: Update Components

#### 9. Update Navigation Component
**File:** `/src/components/Navigation.tsx`
**Replace:** `UserButton` with custom user menu
**Changes:**
- Replace `useUser()` with `useSession()`
- Replace `<UserButton />` with custom dropdown menu
- Add sign-out functionality

#### 10. Update Checkout Page
**File:** `/src/app/checkout/page.tsx`
**Changes:**
- Replace `useUser()` with `useSession()`
- Update user data access pattern

#### 11. Update Create Checkout Session API
**File:** `/src/app/api/create-checkout-session/route.ts`
**Changes:**
- Replace `auth()` and `currentUser()` from Clerk
- Use Auth.js `auth()` function
- Update user ID and email access

---

### PHASE 5: Update All Protected API Routes

**Files to update:**
- `/src/app/api/admin/update-subscription/route.ts`
- `/src/app/api/export/route.ts`
- `/src/app/api/subscription/check/route.ts`
- `/src/app/api/teams/[teamId]/invitations/route.ts`
- `/src/app/api/teams/[teamId]/members/route.ts`
- `/src/app/api/teams/[teamId]/shared-favorites/route.ts`
- `/src/app/api/teams/[teamId]/shared-searches/route.ts`
- `/src/app/api/teams/route.ts`
- `/src/app/api/user/favorites/route.ts`
- `/src/app/api/user/profile/route.ts`

**Pattern for API routes:**
```typescript
// OLD (Clerk):
import { auth, currentUser } from '@clerk/nextjs/server';
const { userId } = await auth();
const user = await currentUser();

// NEW (Auth.js):
import { auth } from '@/auth';
const session = await auth();
const userId = session?.user?.id;
const userEmail = session?.user?.email;
```

---

### PHASE 6: Update Page Components

**Files to update:**
- `/src/app/dashboard/page.tsx`
- `/src/app/favorites/page.tsx`
- `/src/app/profile/page.tsx`
- `/src/app/settings/page.tsx`
- `/src/app/success/page.tsx`
- `/src/app/teams/[teamId]/page.tsx`
- `/src/app/teams/create/page.tsx`
- `/src/app/teams/page.tsx`
- `/src/app/pricing/page.tsx`
- `/src/app/search/page.tsx`
- `/src/app/settings/api/page.tsx`
- `/src/app/admin/subscription/page.tsx`

**Pattern for client components:**
```typescript
// OLD (Clerk):
import { useUser } from '@clerk/nextjs';
const { user, isLoaded } = useUser();

// NEW (Auth.js):
import { useSession } from 'next-auth/react';
const { data: session, status } = useSession();
const user = session?.user;
const isLoaded = status !== 'loading';
```

---

### PHASE 7: Update Utility Components

**Files to update:**
- `/src/components/ExportButton.tsx`
- `/src/components/FavoriteButton.tsx`
- `/src/lib/subscription-utils.ts`

---

### PHASE 8: Cleanup

#### Delete Clerk-specific files:
- `/src/app/sign-in/[[...sign-in]]/page.tsx` (Replace with new sign-in)
- `/src/app/sign-up/[[...sign-up]]/page.tsx` (Replace with new sign-up)
- `/src/app/forgot-password/[[...forgot-password]]/page.tsx`
- `/src/app/test-clerk/page.tsx`
- `/src/app/api/webhooks/clerk/route.ts`
- All Clerk-related scripts in `/scripts/`
- All Clerk-related docs and test files

---

### PHASE 9: Database Migration

Run Drizzle migration to create Auth.js tables:

```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

---

### PHASE 10: Testing

1. Test sign-up flow
2. Test sign-in flow
3. Test sign-out
4. Test protected routes
5. Test Stripe checkout with Auth.js session
6. Run ESLint: `npm run lint`
7. Fix any type errors

---

## Quick Reference: Key Replacements

| Clerk | Auth.js |
|-------|---------|
| `import { useUser } from '@clerk/nextjs'` | `import { useSession } from 'next-auth/react'` |
| `const { user } = useUser()` | `const { data: session } = useSession()` |
| `user.id` | `session?.user?.id` |
| `user.primaryEmailAddress?.emailAddress` | `session?.user?.email` |
| `user.fullName` | `session?.user?.name` |
| `import { auth } from '@clerk/nextjs/server'` | `import { auth } from '@/auth'` |
| `const { userId } = await auth()` | `const session = await auth(); const userId = session?.user?.id` |
| `<ClerkProvider>` | `<SessionProvider>` |
| `clerkMiddleware()` | `auth middleware from NextAuth` |

---

## Environment Variables for Vercel Production

Update these in Vercel Dashboard → Settings → Environment Variables:

**Remove:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWKS_URL`
- All Clerk redirect URLs

**Add:**
- `AUTH_SECRET=7bf6332effa1725ac32b74850cb96fb1675468e26266fa316bba079d3c4a4081`
- `NEXTAUTH_URL=https://ptoagent.app`

**Keep:**
- All Stripe variables
- Database variables
- Google API variables
