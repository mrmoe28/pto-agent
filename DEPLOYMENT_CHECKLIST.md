# Vercel Deployment Checklist

## ✅ Code Changes Deployed

The following fixes have been pushed to GitHub and will trigger automatic Vercel deployment:

1. **Fixed Stripe Checkout API Route** - Added Stripe webhook to public routes
2. **Added Environment Configuration** - Added NEXT_PUBLIC_APP_URL for redirect URLs
3. **Secured Repository** - Removed .env file from git tracking

## 🔧 Required Vercel Environment Variables

**CRITICAL**: You MUST configure these environment variables in the Vercel dashboard before the Stripe checkout will work in production.

### Navigate to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables for **Production** environment:

### Clerk Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cm9tYW50aWMtamVubmV0LTQ5LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_wbXnNxJWGeEMgK5aFvfsg77ua8ZmC87IftZe8eL3tw
CLERK_JWKS_URL=https://romantic-jennet-49.clerk.accounts.dev/.well-known/jwks.json
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### Stripe Configuration (LIVE KEYS)
```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=(set after configuring webhook - see below)
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-production-domain.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-production-domain.vercel.app
```

### Database (NeonDB)
```
DATABASE_URL=postgresql://neondb_owner:npg_CHW9DuN3bvTV@ep-long-wildflower-adf2shp3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_CHW9DuN3bvTV@ep-long-wildflower-adf2shp3.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Google APIs
```
GOOGLE_PLACES_API_KEY=AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo
GOOGLE_MAPS_API_KEY=AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo
GOOGLE_CUSTOM_SEARCH_API_KEY=AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=a0bfe8729f6a445d0
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo
```

### Optional Services
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STACK_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STACK_SECRET_SERVER_KEY=ssk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🔗 Stripe Webhook Configuration

After deploying to Vercel:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-production-domain.vercel.app/api/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret
6. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
7. Redeploy the application

## 📝 Testing Checklist

After deployment and environment variable configuration:

- [ ] Can access homepage
- [ ] Can sign in with Clerk
- [ ] Can view pricing page
- [ ] Can access checkout page with Pro plan
- [ ] Can complete Stripe checkout with test card (4242 4242 4242 4242)
- [ ] Webhook receives subscription events
- [ ] User subscription status is updated in database

## 🚨 Known Issues to Monitor

1. **Clerk Development Warning**: If you see a development warning, ensure you're using production Clerk keys in Vercel
2. **Stripe Redirect URLs**: Must match your production domain exactly
3. **Database Connection**: Ensure NeonDB allows connections from Vercel IP addresses

## 📞 Support

If you encounter issues:
- Check Vercel deployment logs
- Check Stripe webhook logs
- Verify all environment variables are set correctly
- Ensure your production URL is updated in all configs
