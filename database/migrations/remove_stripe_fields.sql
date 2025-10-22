-- Remove Stripe fields from user_subscriptions table
-- Migration: Remove Stripe Integration
-- Date: 2025-10-22

BEGIN;

-- Drop Stripe customer ID column
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS stripe_customer_id;

-- Drop Stripe subscription ID column
ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS stripe_subscription_id;

COMMIT;

-- Verification query (run this after migration to verify)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'user_subscriptions' AND column_name LIKE '%stripe%';
-- Should return no rows
