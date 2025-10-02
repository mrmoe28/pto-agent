import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
    const enterprisePriceId = process.env.STRIPE_ENTERPRISE_PRICE_ID;

    // Check if variables are set
    const config = {
      stripeKeySet: !!stripeSecretKey && stripeSecretKey !== 'sk_test_dummy_key',
      stripeKeyPrefix: stripeSecretKey?.substring(0, 7),
      proPriceIdSet: !!proPriceId,
      proPriceIdValue: proPriceId,
      enterprisePriceIdSet: !!enterprisePriceId,
      enterprisePriceIdValue: enterprisePriceId,
    };

    // Try to initialize Stripe
    if (!stripeSecretKey || stripeSecretKey === 'sk_test_dummy_key') {
      return NextResponse.json({
        success: false,
        error: 'STRIPE_SECRET_KEY not configured',
        config,
      });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Test the connection by retrieving account info
    const account = await stripe.accounts.retrieve();

    // Try to retrieve the Pro price
    let proPriceValid = false;
    let proPriceError = null;
    if (proPriceId) {
      try {
        const proPrice = await stripe.prices.retrieve(proPriceId);
        proPriceValid = true;
        config.proPriceIdValue = `${proPriceId} (${proPrice.currency.toUpperCase()} ${(proPrice.unit_amount || 0) / 100})`;
      } catch (err) {
        proPriceError = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Try to retrieve the Enterprise price
    let enterprisePriceValid = false;
    let enterprisePriceError = null;
    if (enterprisePriceId) {
      try {
        const enterprisePrice = await stripe.prices.retrieve(enterprisePriceId);
        enterprisePriceValid = true;
        config.enterprisePriceIdValue = `${enterprisePriceId} (${enterprisePrice.currency.toUpperCase()} ${(enterprisePrice.unit_amount || 0) / 100})`;
      } catch (err) {
        enterprisePriceError = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      success: true,
      config,
      stripe: {
        accountId: account.id,
        accountType: account.type,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      },
      prices: {
        pro: {
          valid: proPriceValid,
          error: proPriceError,
        },
        enterprise: {
          valid: enterprisePriceValid,
          error: enterprisePriceError,
        },
      },
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
