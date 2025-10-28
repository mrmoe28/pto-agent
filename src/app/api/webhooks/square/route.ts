import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { userSubscriptions, payments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { resetMonthlyUsage } from '@/lib/subscription-utils';

const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!;

/**
 * Verify Square webhook signature
 */
function isValidSignature(body: string, signature: string, url: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', webhookSignatureKey);
    hmac.update(url + body);
    const hash = hmac.digest('base64');
    return hash === signature;
  } catch (error) {
    console.error('[Square Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionUpdate(subscription: unknown) {
  const sub = subscription as Record<string, unknown>;
  try {
    const customerId = sub.customer_id as string;
    const squareSubscriptionId = sub.id as string;

    // Find user subscription by Square customer ID
    const userSub = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.squareCustomerId, customerId),
    });

    if (!userSub) {
      console.error('[Square Webhook] User subscription not found for customer:', customerId);
      return;
    }

    const status = sub.status as string | undefined;
    const startDate = sub.start_date as string | undefined;
    const chargedThroughDate = sub.charged_through_date as string | undefined;

    // Update subscription in database
    await db
      .update(userSubscriptions)
      .set({
        status: status?.toLowerCase() || 'active',
        squareSubscriptionId,
        currentPeriodStart: startDate ? new Date(startDate) : undefined,
        currentPeriodEnd: chargedThroughDate ? new Date(chargedThroughDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.squareCustomerId, customerId));

    console.log('[Square Webhook] Subscription updated:', squareSubscriptionId);
  } catch (error) {
    console.error('[Square Webhook] Error handling subscription update:', error);
  }
}

/**
 * Handle subscription canceled
 */
async function handleSubscriptionCanceled(subscription: unknown) {
  const sub = subscription as Record<string, unknown>;
  try {
    const squareSubscriptionId = sub.id as string;

    await db
      .update(userSubscriptions)
      .set({
        status: 'cancelled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.squareSubscriptionId, squareSubscriptionId));

    console.log('[Square Webhook] Subscription canceled:', squareSubscriptionId);
  } catch (error) {
    console.error('[Square Webhook] Error handling subscription cancellation:', error);
  }
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(invoice: unknown) {
  const inv = invoice as Record<string, unknown>;
  try {
    const subscriptionId = inv.subscription_id as string;

    // Find user subscription
    const userSub = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.squareSubscriptionId, subscriptionId),
    });

    if (!userSub) {
      console.error('[Square Webhook] User subscription not found for invoice');
      return;
    }

    const amountMoney = inv.amount_money as Record<string, unknown> | undefined;
    const amount = amountMoney?.amount as string | undefined;
    const currency = amountMoney?.currency as string | undefined;

    // Record payment
    await db.insert(payments).values({
      userId: userSub.userId,
      squarePaymentId: (inv.payment_id as string) || (inv.id as string),
      amount: parseInt(amount || '0'),
      currency: currency || 'USD',
      status: 'COMPLETED',
      createdAt: new Date(),
    });

    // Reset monthly usage on successful payment (new billing period)
    await resetMonthlyUsage(userSub.userId);

    console.log('[Square Webhook] Invoice payment succeeded for subscription:', subscriptionId);
  } catch (error) {
    console.error('[Square Webhook] Error handling invoice payment:', error);
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: unknown) {
  const inv = invoice as Record<string, unknown>;
  try {
    const subscriptionId = inv.subscription_id as string;

    // Find user subscription
    const userSub = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.squareSubscriptionId, subscriptionId),
    });

    if (!userSub) {
      console.error('[Square Webhook] User subscription not found for failed invoice');
      return;
    }

    // Update subscription status to indicate payment issue
    await db
      .update(userSubscriptions)
      .set({
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, userSub.userId));

    // TODO: Send payment failed email to user

    console.log('[Square Webhook] Invoice payment failed for subscription:', subscriptionId);
  } catch (error) {
    console.error('[Square Webhook] Error handling invoice payment failure:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-square-hmacsha256-signature');
    const url = request.url;

    // Verify webhook signature
    if (!signature || !isValidSignature(body, signature, url)) {
      console.error('[Square Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(body);

    console.log('[Square Webhook] Received event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionUpdate(event.data.object.subscription);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data.object.subscription);
        break;

      case 'invoice.payment_made':
        await handleInvoicePaymentSucceeded(event.data.object.invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object.invoice);
        break;

      default:
        console.log('[Square Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Square Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
