# Clerk 502 Error Troubleshooting & Solution

## 🚨 Issue Identified: Missing Environment Variables

The 502 error you're experiencing with Clerk authentication is most likely caused by **missing or incorrect environment variables**. Your project is missing the `.env.local` file that contains the Clerk API keys.

## 🔍 Root Cause Analysis

1. **Missing Environment File**: No `.env.local` file found in your project
2. **Clerk Configuration**: The setup documentation shows required environment variables that aren't present
3. **API Route Issues**: Your API routes may be failing due to missing database or API configurations

## ✅ Immediate Solution

### Step 1: Create Environment File

Create a `.env.local` file in your project root with the following variables:

```bash
# Clerk Authentication (Development Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cm9tYW50aWMtamVubmV0LTQ5LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_wbXnNxJWGeEMgK5aFvfsg77ua8ZmC87IftZe8eL3tw
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
CLERK_FRONTEND_API_URL=https://romantic-jennet-49.clerk.accounts.dev
CLERK_BACKEND_API_URL=https://api.clerk.com
CLERK_JWKS_URL=https://romantic-jennet-49.clerk.accounts.dev/.well-known/jwks.json

# Database Configuration
DATABASE_URL=your_neon_database_url_here

# Google APIs (if using geocoding)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
LOCATIONIQ_ACCESS_TOKEN=your_locationiq_token_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Verify Clerk Dashboard Configuration

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your project: `romantic-jennet-49`
3. Verify the API keys match what you're using
4. Check that OAuth providers are properly configured

### Step 3: Test Authentication Flow

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Should redirect to `/sign-in` page
4. Test sign-in functionality

## 🔧 Additional Fixes Needed

### 1. Update Middleware Configuration

Your current middleware is using the newer `clerkMiddleware` approach, but it might need adjustment:

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
  '/pricing(.*)',
  '/search(.*)',
  '/api/permit-offices(.*)',
  '/api/geocode(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### 2. Check API Route Error Handling

Your API routes have good error handling, but ensure they're not causing the 502:

- `/api/permit-offices` - Database connection issues
- `/api/geocode` - Missing Google API keys

### 3. Database Connection Issues

If you're getting 502 errors on API routes, check:

1. **Neon Database URL**: Ensure `DATABASE_URL` is correct
2. **Database Schema**: Run migrations if needed
3. **Connection Limits**: Check if you've hit connection limits

## 🚀 Production Deployment Fix

For production deployment on Vercel:

### 1. Set Environment Variables in Vercel

```bash
# Go to Vercel Dashboard → Project Settings → Environment Variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET
DATABASE_URL=your_production_database_url
# ... other variables
```

### 2. Update Production URLs

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
CLERK_FRONTEND_API_URL=https://your-production-instance.clerk.accounts.dev
CLERK_JWKS_URL=https://your-production-instance.clerk.accounts.dev/.well-known/jwks.json
```

## 🔍 Debugging Steps

### 1. Check Browser Console
- Look for JavaScript errors
- Check network requests to Clerk APIs
- Verify environment variables are loaded

### 2. Check Server Logs
```bash
# In development
npm run dev
# Look for error messages in terminal

# In production (Vercel)
# Check Vercel dashboard → Functions → View logs
```

### 3. Test API Endpoints Directly
```bash
# Test geocoding API
curl -X POST http://localhost:3000/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "Atlanta, GA"}'

# Test permit offices API
curl http://localhost:3000/api/permit-offices?city=Atlanta
```

## 🎯 Expected Results After Fix

1. **Home page loads** without 502 error
2. **Sign-in page displays** properly
3. **Authentication flow works** end-to-end
4. **API routes respond** correctly
5. **No console errors** related to Clerk

## 📞 If Issues Persist

1. **Check Clerk Status**: [Clerk Status Page](https://status.clerk.com/)
2. **Verify API Keys**: Ensure keys are valid and not expired
3. **Test with Fresh Browser**: Clear cache and cookies
4. **Check Network**: Ensure no firewall blocking Clerk APIs
5. **Review Logs**: Check both browser console and server logs

## 🔄 Next Steps

1. Create the `.env.local` file with correct variables
2. Restart your development server
3. Test the authentication flow
4. Deploy to production with correct environment variables
5. Monitor for any remaining issues

---

**Priority**: 🔴 High - This should resolve the 502 error immediately
**Estimated Fix Time**: 5-10 minutes
**Testing Required**: Yes - Full authentication flow
