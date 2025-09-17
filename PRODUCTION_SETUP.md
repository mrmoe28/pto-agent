# 🚀 Clerk Production Deployment Guide

## Overview
This guide will help you convert your Clerk development setup to production.

## Step 1: Create Production Instance

1. **Go to Clerk Dashboard**:
   - Visit [dashboard.clerk.com](https://dashboard.clerk.com)
   - Click the "Development" button at the top
   - Select "Create production instance"
   - Choose "Clone development settings" (recommended)

2. **Configure Your Domain**:
   - Go to "Domains" page in Clerk Dashboard
   - Add your production domain (e.g., `yourdomain.com`)
   - Add the required DNS records to your domain
   - Wait up to 48 hours for DNS propagation

## Step 2: Update Environment Variables

### Current Development Keys (Replace These):
```bash
# Development keys (DO NOT use in production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cm9tYW50aWMtamVubmV0LTQ5LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_wbXnNxJWGeEMgK5aFvfsg77ua8ZmC87IftZe8eL3tw
```

### Production Keys Needed:
```bash
# Production keys (Get from Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
```

## Step 3: Update All Environment Variables

### Required Changes for Production:

1. **Clerk Keys** (Get from production instance):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → `pk_live_...`
   - `CLERK_SECRET_KEY` → `sk_live_...`
   - `CLERK_WEBHOOK_SECRET` → Get from production instance

2. **Clerk URLs** (Update with your domain):
   - `CLERK_FRONTEND_API_URL` → `https://your-production-instance.clerk.accounts.dev`
   - `CLERK_JWKS_URL` → `https://your-production-instance.clerk.accounts.dev/.well-known/jwks.json`

3. **App URLs** (Update with your domain):
   - `NEXTAUTH_URL` → `https://yourdomain.com`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` → `https://yourdomain.com`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` → `https://yourdomain.com`

4. **OAuth Credentials** (Get your own):
   - `GOOGLE_CLIENT_ID` → Your production Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` → Your production Google OAuth client secret

## Step 4: Set Up OAuth Providers

### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your production domain to authorized origins
6. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Other OAuth Providers:
- Follow similar process for Facebook, GitHub, etc.
- Each provider has specific setup requirements

## Step 5: Deploy Your Application

### Vercel Deployment:
1. **Set Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all production environment variables
   - Make sure to set them for "Production" environment

2. **Deploy**:
   - Push your code to GitHub
   - Vercel will automatically deploy
   - Verify all environment variables are set

### Other Platforms:
- **Netlify**: Set environment variables in site settings
- **Railway**: Set in project environment variables
- **AWS**: Set in Lambda/ECS environment configuration

## Step 6: Test Production Environment

1. **Verify Authentication**:
   - Test sign-up flow
   - Test sign-in flow
   - Test password reset
   - Test OAuth providers

2. **Check All Features**:
   - Search functionality
   - Dashboard access
   - Profile management
   - Favorites system

## Step 7: Security Checklist

- ✅ Use production API keys only
- ✅ Set up proper CORS policies
- ✅ Enable HTTPS everywhere
- ✅ Set up proper redirect URLs
- ✅ Configure OAuth providers correctly
- ✅ Test all authentication flows
- ✅ Monitor for errors and issues

## Environment Variables Template

Create a `.env.production` file with these variables:

```bash
# Clerk Authentication (PRODUCTION)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
CLERK_SECRET_KEY=sk_live_YOUR_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=https://yourdomain.com
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=https://yourdomain.com
CLERK_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
CLERK_FRONTEND_API_URL=https://your-instance.clerk.accounts.dev
CLERK_BACKEND_API_URL=https://api.clerk.com
CLERK_JWKS_URL=https://your-instance.clerk.accounts.dev/.well-known/jwks.json

# OAuth (PRODUCTION)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# App Configuration (PRODUCTION)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=YOUR_PRODUCTION_SECRET

# Database (PRODUCTION)
DATABASE_URL=YOUR_PRODUCTION_DATABASE_URL

# API Keys (PRODUCTION)
OPENAI_API_KEY=YOUR_OPENAI_KEY
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=YOUR_GOOGLE_PLACES_KEY
LOCATIONIQ_ACCESS_TOKEN=YOUR_LOCATIONIQ_TOKEN
```

## Important Notes

1. **Never commit production keys** to version control
2. **Use environment-specific configuration** in your deployment platform
3. **Test thoroughly** before going live
4. **Monitor logs** for any authentication issues
5. **Keep development and production** instances separate

## Support

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Support](https://clerk.com/support)
- [Deployment Guide](https://clerk.com/docs/deployments/overview)
