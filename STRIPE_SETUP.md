# Stripe Setup Guide

## Current Issue
The checkout is failing because **Stripe Price IDs are not configured**.

## Steps to Fix

### 1. Create Products in Stripe Dashboard

You already have Stripe opened. Create two subscription products:

#### Pro Plan Product:
- Name: **Pro Plan**
- Description: **Ideal for contractors and frequent permit seekers**
- Pricing: **$29.00 / month**
- Recurring: **Monthly**

After creating, copy the **Price ID** (starts with `price_`)

#### Enterprise Plan Product:
- Name: **Enterprise Plan**
- Description: **Perfect for large teams and organizations**
- Pricing: **$99.00 / month**
- Recurring: **Monthly**

After creating, copy the **Price ID** (starts with `price_`)

### 2. Add Price IDs to Local Environment

Edit `.env.local` and add:

```bash
STRIPE_PRO_PRICE_ID="price_XXXXXXXXXXXXX"
STRIPE_ENTERPRISE_PRICE_ID="price_XXXXXXXXXXXXX"
```

### 3. Add Price IDs to Vercel

Run these commands (replace with your actual price IDs):

```bash
vercel env add STRIPE_PRO_PRICE_ID production
# Paste your Pro plan price ID when prompted

vercel env add STRIPE_ENTERPRISE_PRICE_ID production
# Paste your Enterprise plan price ID when prompted
```

### 4. Redeploy

```bash
vercel --prod
```

## Quick Command

Once you have the Price IDs, run:

```bash
# Add to local env
echo 'STRIPE_PRO_PRICE_ID="price_YOUR_PRO_ID"' >> .env.local
echo 'STRIPE_ENTERPRISE_PRICE_ID="price_YOUR_ENTERPRISE_ID"' >> .env.local

# Add to Vercel (will prompt for values)
vercel env add STRIPE_PRO_PRICE_ID production
vercel env add STRIPE_ENTERPRISE_PRICE_ID production

# Redeploy
git add .env.local
git commit -m "feat: add Stripe price IDs for subscriptions"
git push
```

## Verification

After setup, the checkout should work without errors!
