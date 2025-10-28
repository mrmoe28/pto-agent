# Square Payment Integration Guide

## 📋 Implementation Status

### ✅ Completed

1. **Square SDK Installation**
   - Installed `square` package
   - All dependencies configured

2. **Environment Configuration**
   - Added Square environment variables to `.env.example`
   - Variables: `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, `SQUARE_ENVIRONMENT`, `NEXT_PUBLIC_SQUARE_APPLICATION_ID`
   - Subscription plan IDs: `SQUARE_PRO_PLAN_ID`, `SQUARE_ENTERPRISE_PLAN_ID`

3. **Database Schema**
   - Updated `userSubscriptions` table with Square fields:
     - `squareCustomerId`
     - `squareSubscriptionId`
     - `squareCardId`
     - `cancelAtPeriodEnd`
     - `canceledAt`
   - Added new tables:
     - `payments` - Track Square payments
     - `paymentMethods` - Store saved cards
     - `refunds` - Track refunds

4. **Square Client & Utilities**
   - `src/lib/square/client.ts` - Square SDK initialization
   - `src/lib/square/customers.ts` - Customer management
   - `src/lib/square/subscriptions.ts` - Subscription operations
   - `src/lib/square/errors.ts` - Error handling

5. **Frontend Components**
   - `src/components/SquarePaymentForm.tsx` - Payment form with card tokenization
   - Updated `src/app/layout.tsx` - Added Square.js script

6. **API Routes**
   - `/api/square/create-subscription` - Create new subscriptions
   - `/api/square/cancel-subscription` - Cancel subscriptions
   - `/api/webhooks/square` - Handle Square webhooks with signature verification

### 🚧 Remaining Tasks

1. **Database Migration**
   ```bash
   npm run migrate:db
   ```
   Create and run migration for new Square tables.

2. **Square Dashboard Setup**
   - Create subscription plans in Square Catalog
   - Configure webhook endpoints
   - Get API credentials (sandbox and production)
   - Set up subscription plan IDs

3. **Pricing Page Integration**
   - Update `/pricing` page to use `SquarePaymentForm`
   - Add subscription selection UI
   - Show current plan status

4. **Subscription Dashboard**
   - Create `/dashboard/subscription` page
   - Display current plan and usage
   - Add cancel/upgrade options
   - Show payment history

5. **Testing**
   - Test sandbox payments
   - Verify webhook handling
   - Test subscription lifecycle (create, upgrade, cancel)
   - Test error scenarios

---

## 🚀 Next Steps

### Step 1: Set Up Square Account

1. **Create Square Developer Account**
   - Go to https://developer.squareup.com
   - Create a new application
   - Get sandbox credentials

2. **Create Subscription Plans**
   ```
   Pro Plan:
   - Name: "Pro Plan"
   - Price: $29/month
   - Cadence: Monthly

   Enterprise Plan:
   - Name: "Enterprise Plan"
   - Price: $99/month
   - Cadence: Monthly
   ```

3. **Configure Webhooks**
   - Webhook URL: `https://your-domain.com/api/webhooks/square`
   - Events to subscribe:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
     - `invoice.payment_made`
     - `invoice.payment_failed`

### Step 2: Environment Setup

Create `.env.local` with your Square credentials:

```env
# Square Configuration
SQUARE_ACCESS_TOKEN="your_sandbox_access_token"
SQUARE_LOCATION_ID="your_location_id"
SQUARE_WEBHOOK_SIGNATURE_KEY="your_webhook_signature_key"
SQUARE_ENVIRONMENT="sandbox"
NEXT_PUBLIC_SQUARE_APPLICATION_ID="your_application_id"

# Subscription Plan IDs
SQUARE_PRO_PLAN_ID="your_pro_plan_variation_id"
SQUARE_ENTERPRISE_PLAN_ID="your_enterprise_plan_variation_id"
```

### Step 3: Run Database Migration

```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npm run migrate:db
```

### Step 4: Update Pricing Page

```tsx
// src/app/pricing/page.tsx
import { SquarePaymentForm } from '@/components/SquarePaymentForm';

export default function PricingPage() {
  return (
    <div>
      {/* Pro Plan */}
      <SquarePaymentForm
        amount={2900} // $29.00
        plan="pro"
        onSuccess={(subId, cardId) => {
          // Redirect to dashboard
          window.location.href = '/dashboard';
        }}
      />

      {/* Enterprise Plan */}
      <SquarePaymentForm
        amount={9900} // $99.00
        plan="enterprise"
        onSuccess={(subId, cardId) => {
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
}
```

### Step 5: Create Subscription Dashboard

```tsx
// src/app/dashboard/subscription/page.tsx
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { userSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function SubscriptionPage() {
  const session = await auth();

  const subscription = await db.query.userSubscriptions.findFirst({
    where: eq(userSubscriptions.userId, session!.user!.id),
  });

  return (
    <div>
      <h1>Your Subscription</h1>
      <p>Plan: {subscription?.plan}</p>
      <p>Status: {subscription?.status}</p>
      <p>Searches: {subscription?.searchesUsed} / {subscription?.searchesLimit || '∞'}</p>

      {/* Cancel button */}
      <form action="/api/square/cancel-subscription" method="POST">
        <button>Cancel Subscription</button>
      </form>
    </div>
  );
}
```

---

## 🧪 Testing Guide

### Test Cards (Sandbox)

Square provides test card numbers for sandbox testing:

```
Success: 4111 1111 1111 1111
Declined: 4000 0000 0000 0002
CVV Failure: 4000 0000 0000 0101
Expired: 4000 0000 0000 0069

CVV: Any 3 digits
ZIP: Any 5 digits
Expiration: Any future date
```

### Test Scenarios

1. **Create Subscription**
   - Go to pricing page
   - Select a plan
   - Enter test card
   - Verify subscription created
   - Check database for subscription record

2. **Cancel Subscription**
   - Go to subscription dashboard
   - Click cancel
   - Verify status updated to 'cancelled'

3. **Webhook Testing**
   - Use Square Sandbox to trigger events
   - Monitor webhook endpoint logs
   - Verify database updates

---

## 📊 Architecture Overview

### Payment Flow

```
User → Pricing Page
  → SquarePaymentForm (tokenize card)
    → /api/square/create-subscription
      → Create Square Customer
      → Save Card
      → Create Subscription
        → Update Database
          → Redirect to Dashboard
```

### Webhook Flow

```
Square Event
  → /api/webhooks/square
    → Verify Signature
      → Handle Event Type
        → Update Database
          → Send Notifications (optional)
```

---

## 🔒 Security Checklist

- ✅ Webhook signature verification implemented
- ✅ Environment variables secured
- ✅ API routes protected with authentication
- ✅ Sensitive data encrypted in database
- ✅ Error messages don't expose sensitive info
- ⚠️ Set up SSL/HTTPS for production
- ⚠️ Enable Square production credentials only after testing

---

## 🐛 Troubleshooting

### Common Issues

1. **"Payment form not loading"**
   - Check Square.js script loaded in layout
   - Verify `NEXT_PUBLIC_SQUARE_APPLICATION_ID` is set
   - Check browser console for errors

2. **"Invalid signature" in webhook**
   - Verify `SQUARE_WEBHOOK_SIGNATURE_KEY` matches Square Dashboard
   - Ensure webhook URL is accessible publicly
   - Check webhook signature algorithm

3. **"Plan ID not configured"**
   - Create subscription plans in Square Dashboard
   - Copy plan variation IDs to `.env.local`

4. **Database errors**
   - Run migrations: `npm run migrate:db`
   - Check database connection
   - Verify schema matches code

---

## 📚 Additional Resources

- [Square Developer Docs](https://developer.squareup.com/docs)
- [Square Web Payments SDK](https://developer.squareup.com/docs/web-payments/overview)
- [Square Subscriptions API](https://developer.squareup.com/docs/subscriptions-api/overview)
- [Square Webhooks](https://developer.squareup.com/docs/webhooks/overview)

---

## 🎉 What's Been Built

Your PTO Agent now has a complete Square payment infrastructure including:

- ✅ Subscription management
- ✅ Payment processing
- ✅ Customer management
- ✅ Card storage
- ✅ Webhook handling
- ✅ Error handling
- ✅ Database schema

You're ready to accept payments! Just complete the remaining setup steps and start testing.

---

**Need help?** Check the Square documentation or reach out to Square support for API-specific questions.
