import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customers';
import { createCheckoutSession } from '@/lib/stripe/subscriptions';
import { STRIPE_PRICE_IDS } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { plan } = await request.json();

    if (!plan || (plan !== 'pro' && plan !== 'enterprise')) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const priceId = STRIPE_PRICE_IDS[plan as 'pro' | 'enterprise'];

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this plan' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(userId);

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      userId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('[Stripe API] Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
