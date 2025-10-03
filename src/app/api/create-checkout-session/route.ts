import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key');

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    const { planId } = await request.json();

    if (!planId || !['pro', 'enterprise'].includes(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Define price IDs (these should match your Stripe products)
    const priceIds: Record<string, string> = {
      pro: process.env.STRIPE_PRO_PRICE_ID || '',
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    };

    const priceId = priceIds[planId];

    if (!priceId) {
      console.error('🔴 Missing Stripe price ID:', {
        planId,
        envVars: {
          STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID ? 'SET' : 'MISSING',
          STRIPE_ENTERPRISE_PRICE_ID: process.env.STRIPE_ENTERPRISE_PRICE_ID ? 'SET' : 'MISSING',
        }
      });
      return NextResponse.json(
        { error: 'Price ID not configured' },
        { status: 500 }
      );
    }

    console.log('✅ Creating checkout session:', {
      planId,
      priceId: priceId.substring(0, 15) + '...',
      userId: userId.substring(0, 8) + '...',
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId,
        planId,
      },
    });

    return NextResponse.json({ sessionId: stripeSession.id, url: stripeSession.url });
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('🔴 Checkout session creation error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
      fullError: error,
    });

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      },
      { status: 500 }
    );
  }
}
