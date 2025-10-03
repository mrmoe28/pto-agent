# Stripe Setup Instructions - URGENT

## The Problem
Stripe API keys have NEVER been configured in this project. The `.env` file has always had them commented out.

## The Solution (3 Minutes)

### Step 1: Get Your Stripe Keys (1 minute)
1. Go to: https://dashboard.stripe.com/test/apikeys
2. You'll see TWO keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

### Step 2: Create Products (1 minute)
1. Go to: https://dashboard.stripe.com/test/products
2. Click "**+ Add Product**"
3. Create TWO products:

**Product 1: Pro Plan**
- Name: `Pro Plan`
- Price: `$29.00 USD`
- Billing: `Recurring` - `Monthly`
- Click "Save product"
- **COPY THE PRICE ID** (starts with `price_`) - you'll see it in the pricing section

**Product 2: Enterprise Plan**
- Name: `Enterprise Plan`
- Price: `$99.00 USD`
- Billing: `Recurring` - `Monthly`
- Click "Save product"
- **COPY THE PRICE ID**

### Step 3: Update .env File (1 minute)
Open `/Users/ekodevapps/Downloads/pto-agent-main/.env` and update lines 19-23:

```bash
STRIPE_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY_HERE"
STRIPE_PRO_PRICE_ID="price_YOUR_PRO_PRICE_ID"
STRIPE_ENTERPRISE_PRICE_ID="price_YOUR_ENTERPRISE_PRICE_ID"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
```

### Step 4: Restart Server
```bash
# Kill existing servers
lsof -ti:3000 | xargs kill -9
lsof -ti:3006 | xargs kill -9

# Start fresh
npm run dev
```

### Step 5: Test
1. Go to: http://localhost:3000/pricing
2. Click "Upgrade Now" on Pro
3. You should see Stripe checkout with credit card fields
4. Use test card: `4242 4242 4242 4242`, exp: `12/34`, CVC: `123`

## Verification
After setup, test the configuration:
```bash
curl http://localhost:3000/api/test-stripe
```

Should return `"success": true` with your Stripe account details.

---

**TIME TO FIX: 3 minutes**
**REQUIREMENT: You must do this manually - I cannot access your Stripe dashboard**
