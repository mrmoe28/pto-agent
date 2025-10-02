# Stripe Checkout Setup Guide

## Overview

This guide walks you through setting up Stripe payments with Clerk authentication for your application.

## Prerequisites

1. Stripe account (https://dashboard.stripe.com)
2. Clerk account with Stripe integration enabled
3. Access to your Vercel deployment settings (for production)

## Step 1: Create Stripe Products and Prices

### 1.1 Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Click "Add Product"

**Pro Plan:**
- Name: `Pro Plan`
- Description: `Ideal for contractors and frequent permit seekers`
- Pricing: `$29/month` (recurring)
- Copy the **Price ID** (starts with `price_...`)

**Enterprise Plan:**
- Name: `Enterprise Plan`
- Description: `Perfect for large teams and organizations`
- Pricing: `$99/month` (recurring)
- Copy the **Price ID** (starts with `price_...`)

### 1.2 Get Your Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** (starts with `pk_...`)
3. Copy your **Secret key** (starts with `sk_...`)

### 1.3 Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set endpoint URL to: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy your **Webhook signing secret** (starts with `whsec_...`)

## Step 2: Configure Environment Variables

### Local Development (.env)

Add these to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each of the above variables:
   - `STRIPE_SECRET_KEY` → Use **live mode** secret key (sk_live_...)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Use **live mode** publishable key (pk_live_...)
   - `STRIPE_WEBHOOK_SECRET` → Your webhook signing secret
   - `STRIPE_PRO_PRICE_ID` → Pro plan price ID
   - `STRIPE_ENTERPRISE_PRICE_ID` → Enterprise plan price ID
   - `NEXT_PUBLIC_APP_URL` → Your production URL (https://your-domain.com)

4. Redeploy your application

## Step 3: Test the Checkout Flow

### Testing Locally

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/pricing`
3. Click "Get Started" on a plan
4. You'll be redirected to `/checkout?plan=pro` (or enterprise)
5. Click "Subscribe to Pro"
6. You'll be redirected to Stripe Checkout

### Stripe Test Cards

Use these test card numbers in Stripe Checkout (test mode):

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Payment Declined:**
- Card: `4000 0000 0000 0002`

**Payment Requires Authentication:**
- Card: `4000 0025 0000 3155`

## Step 4: Verify Webhook Integration

### Test Webhook Locally (Optional)

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Test a payment and watch webhook events in terminal

### Verify Production Webhooks

1. Make a test purchase in production
2. Go to https://dashboard.stripe.com/webhooks
3. Click on your webhook endpoint
4. Check "Recent deliveries" for successful webhook calls
5. Verify user metadata is updated in Clerk dashboard

## Step 5: Monitor and Maintain

### Check Subscription Status

Users' subscription plans are stored in two places:

1. **Clerk Metadata** (`publicMetadata.subscriptionPlan`)
   - View in Clerk Dashboard → Users → Select user → Metadata

2. **Database** (`user_subscriptions` table)
   - Query: `SELECT * FROM user_subscriptions WHERE user_id = 'user_xxx'`

### Handle Subscription Changes

When users upgrade/downgrade:
- Stripe automatically prorates charges
- Webhooks update both Clerk metadata and database
- Search limits are updated immediately

### Failed Payments

When payment fails:
1. Stripe sends `invoice.payment_failed` webhook
2. You can add custom logic in the webhook handler
3. Notify user via email (implement in webhook handler)

## Troubleshooting

### Checkout Not Working

1. Check console for errors
2. Verify all environment variables are set
3. Ensure Stripe keys match the mode (test vs live)

### Webhooks Not Firing

1. Check webhook signing secret is correct
2. Verify webhook URL is publicly accessible
3. Check webhook delivery logs in Stripe dashboard

### User Not Upgraded After Payment

1. Check webhook events in Stripe dashboard
2. Verify `checkout.session.completed` event was received
3. Check application logs for webhook processing errors
4. Verify user email in Stripe matches Clerk email

## Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Always verify webhook signatures** (already implemented)
3. **Use HTTPS** in production
4. **Store sensitive data** in environment variables
5. **Monitor Stripe dashboard** for suspicious activity

## Support

- Stripe Documentation: https://stripe.com/docs
- Clerk Documentation: https://clerk.com/docs
- Stripe Support: https://support.stripe.com

## Next Steps

1. ✅ Configure Stripe products and prices
2. ✅ Add environment variables
3. ✅ Test checkout flow
4. ✅ Verify webhook integration
5. 🔄 Customize success page
6. 🔄 Add billing management page
7. 🔄 Implement subscription cancellation
8. 🔄 Add usage tracking dashboard
