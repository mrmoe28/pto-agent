-- Add Stripe fields to user_subscriptions table
-- Migration: Add Stripe Integration
-- Date: 2025-10-28

BEGIN;

-- Add Stripe customer ID column
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add Stripe subscription ID column
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer
  ON user_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription
  ON user_subscriptions(stripe_subscription_id);

COMMIT;

-- Verification query (run this after migration to verify)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'user_subscriptions' AND column_name LIKE '%stripe%';
-- Should return: stripe_customer_id, stripe_subscription_id
