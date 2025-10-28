import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOrCreateSquareCustomer } from '@/lib/square/customers';
import { createSquareSubscription, saveSquareCard, SQUARE_PLAN_IDS } from '@/lib/square/subscriptions';
import { handleSquareError } from '@/lib/square/errors';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sourceId, plan } = await request.json();

    // Validate plan
    if (plan !== 'pro' && plan !== 'enterprise') {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Validate sourceId
    if (!sourceId) {
      return NextResponse.json(
        { success: false, error: 'Payment method required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get or create Square customer
    const customer = await getOrCreateSquareCustomer(userId);

    if (!customer || !customer.id) {
      return NextResponse.json(
        { success: false, error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    // Save card on file
    const card = await saveSquareCard(sourceId, customer.id, userId);

    if (!card || !card.id) {
      return NextResponse.json(
        { success: false, error: 'Failed to save payment method' },
        { status: 500 }
      );
    }

    // Get plan ID from environment
    const planId = SQUARE_PLAN_IDS[plan];

    if (!planId) {
      return NextResponse.json(
        { success: false, error: `Plan ID not configured for ${plan}` },
        { status: 500 }
      );
    }

    // Create subscription
    const subscription = await createSquareSubscription({
      customerId: customer.id,
      userId,
      planId,
      cardId: card.id,
      plan,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      cardId: card.id,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('[API] Error creating subscription:', error);

    const errorMessage = handleSquareError(error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}
