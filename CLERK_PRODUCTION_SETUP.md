# Clerk Production Setup Guide

## Step 1: Create Production Instance

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click "Development" dropdown at the top
3. Select "Create production instance"
4. Choose "Clone development instance settings" (recommended)

## Step 2: Update Environment Variables

After creating your production instance, update these environment variables:

### Production Clerk Keys
```bash
# Replace with your actual production keys from Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY_HERE
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY_HERE
```

### Production Clerk URLs
```bash
# These will be provided by Clerk for your production instance
CLERK_FRONTEND_API_URL=https://YOUR_PRODUCTION_INSTANCE.clerk.accounts.dev
CLERK_JWKS_URL=https://YOUR_PRODUCTION_INSTANCE.clerk.accounts.dev/.well-known/jwks.json
CLERK_WEBHOOK_SECRET=YOUR_PRODUCTION_WEBHOOK_SECRET_HERE
```

### Keep Existing URLs
```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
CLERK_BACKEND_API_URL=https://api.clerk.com
```

## Step 3: OAuth Credentials

For production, you need to set up your own OAuth credentials:

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your production domain to authorized origins
6. Update these in Clerk Dashboard under "OAuth" settings

### Other OAuth Providers
- **GitHub**: Create OAuth App in GitHub Settings
- **Microsoft**: Register app in Azure Portal
- **Apple**: Create Service ID in Apple Developer Console

## Step 4: Webhooks

Update webhook endpoints to use your production domain:

1. Go to Clerk Dashboard → Webhooks
2. Update webhook URL to: `https://yourdomain.com/api/webhooks/clerk`
3. Copy the new webhook signing secret
4. Update `CLERK_WEBHOOK_SECRET` in your environment

## Step 5: DNS Records

Clerk will provide DNS records you need to add:

1. Go to Clerk Dashboard → Domains
2. Add your production domain
3. Follow the DNS setup instructions
4. Wait for DNS propagation (up to 48 hours)

## Step 6: Deploy Certificates

Once all steps are complete:
1. Click "Deploy certificates" in Clerk Dashboard
2. Wait for certificate issuance
3. Your production instance will be live

## Step 7: Update Your App

### For Vercel Deployment:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all production environment variables
3. Redeploy your application

### For Other Hosting Providers:
- Add environment variables in your hosting provider's dashboard
- Redeploy your application

## Security Considerations

### Content Security Policy (CSP)
If using CSP, add Clerk domains to your policy:
```html
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' https://clerk.accounts.dev;
  connect-src 'self' https://clerk.accounts.dev https://api.clerk.com;
">
```

### authorizedParties Configuration
For enhanced security, configure authorizedParties in your middleware:

```typescript
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs'

export default clerkMiddleware({
  authorizedParties: ['https://yourdomain.com'],
})
```

## Testing Production

1. Deploy your app with production environment variables
2. Test sign-up/sign-in flows
3. Verify webhooks are working
4. Test OAuth providers
5. Check that user data is being created correctly

## Troubleshooting

### Common Issues:
- **API Keys**: Make sure you're using production keys (`pk_live_`, `sk_live_`)
- **DNS**: Wait for DNS propagation (up to 48 hours)
- **OAuth**: Verify OAuth credentials are set up correctly
- **Webhooks**: Check webhook URL and signing secret

### Certificate Issues:
If deployment is stuck on certificate issuance:
1. Check for CAA DNS records on your domain
2. Run: `dig yourdomain.com +short CAA`
3. Remove any CAA records that block Let's Encrypt or Google Trust Services

## Next Steps

1. Create production instance in Clerk Dashboard
2. Update environment variables
3. Set up OAuth credentials
4. Configure webhooks
5. Add DNS records
6. Deploy certificates
7. Update your hosting environment
8. Test production deployment
