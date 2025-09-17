# ✅ Clerk Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Clerk Dashboard Setup
- [ ] Create production instance in Clerk Dashboard
- [ ] Clone development settings to production
- [ ] Add your production domain
- [ ] Configure DNS records
- [ ] Get production API keys (`pk_live_` and `sk_live_`)

### 2. Environment Variables
- [ ] Replace `pk_test_` with `pk_live_` key
- [ ] Replace `sk_test_` with `sk_live_` key
- [ ] Update all URLs to use production domain
- [ ] Set up production OAuth credentials
- [ ] Update database connection string

### 3. OAuth Providers
- [ ] Google OAuth: Create production client ID/secret
- [ ] Add production domain to authorized origins
- [ ] Test OAuth flow in production

### 4. Security
- [ ] Never commit production keys to Git
- [ ] Use environment variables in deployment platform
- [ ] Enable HTTPS everywhere
- [ ] Set up proper CORS policies

## Deployment Steps

### 1. Vercel Deployment
```bash
# Set environment variables in Vercel Dashboard
# Deploy from GitHub
vercel --prod
```

### 2. Environment Variables to Set
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=https://yourdomain.com
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=https://yourdomain.com
CLERK_WEBHOOK_SECRET=...
CLERK_FRONTEND_API_URL=https://your-instance.clerk.accounts.dev
CLERK_JWKS_URL=https://your-instance.clerk.accounts.dev/.well-known/jwks.json
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
```

## Post-Deployment Testing

### Authentication Tests
- [ ] Sign up with email
- [ ] Sign in with email
- [ ] Password reset flow
- [ ] Google OAuth sign-in
- [ ] Sign out functionality

### Application Tests
- [ ] Dashboard loads correctly
- [ ] Search functionality works
- [ ] Favorites system works
- [ ] Profile management works
- [ ] All protected routes work

### Error Monitoring
- [ ] Check Vercel function logs
- [ ] Monitor Clerk dashboard for errors
- [ ] Test on different devices/browsers

## Common Issues & Solutions

### Issue: "Publishable key not valid"
**Solution**: Make sure you're using `pk_live_` key, not `pk_test_`

### Issue: OAuth not working
**Solution**: Check that production domain is added to OAuth provider

### Issue: Redirect loops
**Solution**: Verify all redirect URLs are set correctly

### Issue: CORS errors
**Solution**: Check that your domain is added to Clerk's allowed origins

## Quick Commands

```bash
# Check current environment
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Check environment variables
vercel env ls
```

## Support Resources

- [Clerk Dashboard](https://dashboard.clerk.com)
- [Clerk Documentation](https://clerk.com/docs)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com)
