# Clerk Production Deployment Checklist

## ✅ Pre-Deployment Steps

### 1. Create Production Instance
- [ ] Go to [Clerk Dashboard](https://dashboard.clerk.com)
- [ ] Click "Development" dropdown
- [ ] Select "Create production instance"
- [ ] Choose "Clone development instance settings"

### 2. Get Production API Keys
- [ ] Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_`)
- [ ] Copy `CLERK_SECRET_KEY` (starts with `sk_live_`)
- [ ] Copy `CLERK_FRONTEND_API_URL`
- [ ] Copy `CLERK_JWKS_URL`
- [ ] Copy `CLERK_WEBHOOK_SECRET`

### 3. Set Up OAuth Credentials
- [ ] **Google OAuth**: Create OAuth 2.0 credentials in Google Cloud Console
- [ ] **GitHub OAuth**: Create OAuth App in GitHub Settings
- [ ] **Microsoft OAuth**: Register app in Azure Portal
- [ ] **Apple OAuth**: Create Service ID in Apple Developer Console
- [ ] Update OAuth settings in Clerk Dashboard

### 4. Configure Webhooks
- [ ] Go to Clerk Dashboard → Webhooks
- [ ] Update webhook URL to: `https://yourdomain.com/api/webhooks/clerk`
- [ ] Copy new webhook signing secret
- [ ] Test webhook endpoint

### 5. Set Up DNS Records
- [ ] Go to Clerk Dashboard → Domains
- [ ] Add your production domain
- [ ] Follow DNS setup instructions
- [ ] Wait for DNS propagation (up to 48 hours)

## ✅ Environment Variables

### Required Production Variables
```bash
# Clerk Production Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_live_YOUR_KEY_HERE

# Clerk Production URLs
CLERK_FRONTEND_API_URL=https://YOUR_INSTANCE.clerk.accounts.dev
CLERK_JWKS_URL=https://YOUR_INSTANCE.clerk.accounts.dev/.well-known/jwks.json
CLERK_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Keep existing URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
CLERK_BACKEND_API_URL=https://api.clerk.com
```

## ✅ Security Configuration

### Middleware Security
- [ ] Update `middleware.ts` with `authorizedParties`
- [ ] Set `NEXT_PUBLIC_APP_URL` environment variable
- [ ] Test middleware in production

### Content Security Policy
- [ ] Add Clerk domains to CSP if using one
- [ ] Test CSP doesn't block Clerk functionality

## ✅ Deployment Steps

### 1. Deploy Certificates
- [ ] Complete all pre-deployment steps
- [ ] Click "Deploy certificates" in Clerk Dashboard
- [ ] Wait for certificate issuance

### 2. Update Hosting Environment
- [ ] Add all production environment variables to hosting provider
- [ ] Redeploy application
- [ ] Verify environment variables are loaded

### 3. Test Production
- [ ] Test sign-up flow
- [ ] Test sign-in flow
- [ ] Test OAuth providers
- [ ] Test webhook functionality
- [ ] Test user data creation
- [ ] Test protected routes

## ✅ Post-Deployment Verification

### Authentication Tests
- [ ] User can sign up with email
- [ ] User can sign in with email
- [ ] OAuth providers work (Google, GitHub, etc.)
- [ ] User sessions persist across page refreshes
- [ ] Sign out works correctly

### Security Tests
- [ ] Protected routes require authentication
- [ ] Unauthorized users are redirected to sign-in
- [ ] Webhooks are receiving events
- [ ] No console errors related to Clerk

### Performance Tests
- [ ] Authentication is fast
- [ ] No unnecessary API calls
- [ ] User data loads quickly

## 🚨 Troubleshooting

### Common Issues
- **API Keys**: Ensure using production keys (`pk_live_`, `sk_live_`)
- **DNS**: Wait for DNS propagation (up to 48 hours)
- **OAuth**: Verify OAuth credentials are correct
- **Webhooks**: Check webhook URL and signing secret
- **CSP**: Ensure Clerk domains are allowed

### Certificate Issues
- **Stuck on certificate issuance**: Check for CAA DNS records
- **Run**: `dig yourdomain.com +short CAA`
- **Remove CAA records** that block Let's Encrypt or Google Trust Services

### Environment Issues
- **Variables not loading**: Check hosting provider configuration
- **Wrong keys**: Verify you're using production keys
- **URLs incorrect**: Check Clerk Dashboard for correct URLs

## 📞 Support

If you encounter issues:
1. Check Clerk Dashboard for error messages
2. Review Clerk documentation
3. Check browser console for errors
4. Verify environment variables are correct
5. Test with a fresh browser session

## 🎉 Success Criteria

Your Clerk production deployment is successful when:
- [ ] Users can sign up and sign in
- [ ] OAuth providers work
- [ ] Webhooks are functioning
- [ ] No authentication errors
- [ ] User data is being created correctly
- [ ] Protected routes work as expected
