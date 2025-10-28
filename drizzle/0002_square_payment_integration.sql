-- Square Payment Integration Migration
-- Adds Square-specific columns and creates payment-related tables

-- Add Square fields to user_subscriptions table
ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "square_customer_id" text;
ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "square_subscription_id" text;
ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "square_card_id" text;
ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "cancel_at_period_end" boolean DEFAULT false;
ALTER TABLE "user_subscriptions" ADD COLUMN IF NOT EXISTS "canceled_at" timestamp;

-- Create payments table
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"square_payment_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text NOT NULL,
	"receipt_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_square_payment_id_unique" UNIQUE("square_payment_id"),
	CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"square_card_id" text,
	"last4" text NOT NULL,
	"brand" text NOT NULL,
	"exp_month" integer NOT NULL,
	"exp_year" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_methods_square_card_id_unique" UNIQUE("square_card_id"),
	CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
);

-- Create refunds table
CREATE TABLE IF NOT EXISTS "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid,
	"square_refund_id" text,
	"amount" integer NOT NULL,
	"reason" text,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_square_refund_id_unique" UNIQUE("square_refund_id"),
	CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE cascade ON UPDATE no action
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "payments_user_id_idx" ON "payments" ("user_id");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" ("status");
CREATE INDEX IF NOT EXISTS "payment_methods_user_id_idx" ON "payment_methods" ("user_id");
CREATE INDEX IF NOT EXISTS "refunds_payment_id_idx" ON "refunds" ("payment_id");
