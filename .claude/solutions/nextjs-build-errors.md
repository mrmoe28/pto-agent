# Next.js Build Error Solutions

## Problem: Vercel Build Error - "Couldn't find any 'pages' or 'app' directory"

### Root Cause
The build was failing due to multiple TypeScript and Next.js configuration issues, not the directory structure itself.

### Solutions Applied

#### 1. NextAuth Session Type Extension
**Error**: `Property 'id' does not exist on type '{ name?: string | null | undefined; email?: string | null | undefined; image?: string | null | undefined; }'`

**Solution**: Created type declaration file to extend NextAuth session interface.

**File**: `src/types/next-auth.d.ts`
```typescript
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
```

#### 2. Drizzle Schema Compatibility with NextAuth Adapter
**Error**: Type incompatibility between custom schema and NextAuth adapter expectations.

**Solutions**:
- Changed `expires_at` from `bigint` to `integer` in accounts table
- Made `sessionToken` the primary key in sessions table (removed separate `id` field)
- Removed unused `bigint` import

**File**: `src/lib/db/schema.ts`
```typescript
// Before
expires_at: bigint('expires_at', { mode: 'number' }),

// After  
expires_at: integer('expires_at'),

// Before
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('session_token').unique().notNull(),
  // ...
});

// After
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  // ...
});
```

#### 3. Suspense Boundary for useSearchParams
**Error**: `useSearchParams() should be wrapped in a suspense boundary`

**Solution**: Wrapped component using `useSearchParams` in Suspense boundary.

**File**: `src/app/auth/signin/page.tsx`
```typescript
// Split component into SignInForm and main SignIn component
function SignInForm() {
  // Component logic with useSearchParams
}

export default function SignIn() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SignInForm />
    </Suspense>
  );
}
```

#### 4. Vercel Configuration
**File**: `vercel.json`
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Final Result
✅ Build successful with exit code 0
✅ All TypeScript errors resolved
✅ Next.js App Router properly configured
✅ Ready for Vercel deployment

### Key Learnings
1. NextAuth requires specific database schema structure for the adapter
2. useSearchParams() must be wrapped in Suspense for static generation
3. TypeScript module augmentation needed for custom session properties
4. Vercel configuration should explicitly specify build commands for src/ directory structure
