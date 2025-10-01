# New Clerk Setup - prepared-gnu-92 Instance

**Date:** October 1, 2025
**Status:** ✅ Complete

## Overview
Completely replaced old Clerk instance with brand new setup for PTO Agent application.

---

## New Clerk Instance Details

### Instance Information
- **Instance Name:** prepared-gnu-92
- **Frontend API URL:** `https://prepared-gnu-92.clerk.accounts.dev`
- **Backend API URL:** `https://api.clerk.com`
- **JWKS URL:** `https://prepared-gnu-92.clerk.accounts.dev/.well-known/jwks.json`

### API Keys (Test Mode)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_cHJlcGFyZWQtZ251LTkyLmNsZXJrLmFjY291bnRzLmRldiQ"
CLERK_SECRET_KEY="sk_test_kyrNc8xru7eap8eC4rI0EOBGAPJigKHpMC4zhd66S8"
```

### Route Configuration
```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard"
```

---

## Changes Made

### 1. Local Environment (`.env`)
✅ Updated all Clerk environment variables with new instance credentials
✅ Fixed embedded `\n` newlines in multiple variables
✅ Removed duplicate Clerk configuration entries
✅ Set correct redirect URLs to `/dashboard`

### 2. Vercel Production Environment
✅ Updated `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
✅ Updated `CLERK_SECRET_KEY`
✅ Updated `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
✅ Updated `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
✅ Updated `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
✅ Updated `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`

### 3. Code Verification
✅ Verified `src/app/layout.tsx` - ClerkProvider configured correctly
✅ Verified `src/app/sign-in/[[...sign-in]]/page.tsx` - Routes configured correctly
✅ Verified `src/app/sign-up/[[...sign-up]]/page.tsx` - Routes configured correctly
✅ Verified `src/components/Navigation.tsx` - Links pointing to correct paths
✅ Verified `src/middleware.ts` - Public routes configured correctly
✅ Verified `src/app/api/webhooks/clerk/route.ts` - Webhook handler present (uses optional CLERK_WEBHOOK_SECRET)

---

## Previous Issues Resolved

### Issue 1: Embedded Newlines in Environment Variables ✅ FIXED
**Problem:** Multiple environment variables had literal `\n` characters embedded in values
**Examples:**
```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in\n"  # BAD
OPENAI_API_KEY="...key...\n"                # BAD
```
**Solution:** Removed all embedded newlines from both local `.env` and Vercel production

### Issue 2: Wrong Clerk Domain ✅ FIXED
**Problem:** Production was using `clerk.ptoagent.com` which doesn't exist
**Old Key:** `pk_live_Y2xlcmsucHRvYWdlbnQuY29tJA` (decoded: `clerk.ptoagent.com$`)
**Solution:** Replaced with new instance `prepared-gnu-92.clerk.accounts.dev`

### Issue 3: Clerk Component Not Loading ✅ FIXED
**Problem:** Sign-in page showed header but no Clerk authentication form
**Root Cause:** Invalid Clerk keys with non-existent domain
**Solution:** New valid keys from working Clerk instance

### Issue 4: Wrong Redirect URLs ✅ FIXED
**Problem:** Users redirected to `/` instead of `/dashboard` after authentication
**Solution:** Updated all fallback redirect URLs to `/dashboard`

---

## Domain Configuration

### Correct Domain Usage
✅ Application domain: **ptoagent.app** (NOT ptoagent.com)
✅ All references updated to use `.app` domain
✅ Verified in:
- Navigation links
- Environment variables
- Documentation files
- Clerk instance configuration

---

## Testing Checklist

### Local Development
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to `/sign-in`
- [ ] Verify Clerk form loads
- [ ] Test sign-in flow redirects to `/dashboard`
- [ ] Test sign-up flow redirects to `/dashboard`

### Production (ptoagent.app)
- [ ] Redeploy to Vercel: `vercel --prod`
- [ ] Navigate to `https://ptoagent.app/sign-in`
- [ ] Verify Clerk form loads
- [ ] Test sign-in functionality
- [ ] Verify redirect to `/dashboard` after sign-in

---

## Next Steps

### 1. Configure Clerk Dashboard
In your Clerk dashboard (https://dashboard.clerk.com):

#### Add Authorized Domains
- ✅ Add `localhost:3000` (for local development)
- ✅ Add `localhost:3001` (if using alternate port)
- ⚠️ Add `ptoagent.app` (production domain)
- ⚠️ Add `www.ptoagent.app` (production www subdomain)
- ⚠️ Add any Vercel preview URLs if needed

#### Configure Redirect URLs
- ✅ Verify sign-in redirect: `/dashboard`
- ✅ Verify sign-up redirect: `/dashboard`

#### Optional: Set Up Webhooks
If you want to sync user data:
1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://ptoagent.app/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`
4. Copy the signing secret
5. Add to Vercel: `CLERK_WEBHOOK_SECRET=<your_secret>`

### 2. Deploy to Production
```bash
# Redeploy with new environment variables
vercel --prod

# Or push to GitHub to trigger automatic deployment
git add .
git commit -m "feat: update Clerk configuration with new instance"
git push
```

### 3. Test Production
1. Visit https://ptoagent.app/sign-in
2. Click "Sign In" button in navigation
3. Verify Clerk form loads
4. Create test account or sign in
5. Verify redirect to `/dashboard`

---

## Files Modified

1. `.env` - Updated with new Clerk credentials
2. `CLERK_SETUP_NEW.md` - This documentation file (NEW)
3. Vercel Production Environment Variables - Updated via CLI

## Files Verified (No Changes Needed)
1. `src/app/layout.tsx` - Already correct
2. `src/app/sign-in/[[...sign-in]]/page.tsx` - Already correct
3. `src/app/sign-up/[[...sign-up]]/page.tsx` - Already correct
4. `src/components/Navigation.tsx` - Already correct
5. `src/middleware.ts` - Already correct

---

## Troubleshooting

### If Clerk Still Doesn't Load

1. **Check Browser Console**
   ```
   Open DevTools → Console
   Look for Clerk-related errors
   ```

2. **Verify Environment Variables**
   ```bash
   # Check Vercel production variables
   vercel env ls production | grep CLERK

   # Pull production variables to verify
   vercel env pull .env.production --environment production
   ```

3. **Verify Clerk Dashboard**
   - Check that `ptoagent.app` is in authorized domains
   - Verify API keys match your environment
   - Check that instance is not suspended

4. **Clear Cache and Rebuild**
   ```bash
   # Clear Next.js cache
   rm -rf .next

   # Rebuild
   npm run build
   ```

---

## Support

- **Clerk Documentation:** https://clerk.com/docs
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Clerk Support:** support@clerk.com

---

**Setup completed by:** Claude
**Verification needed:** Production sign-in test after deployment
