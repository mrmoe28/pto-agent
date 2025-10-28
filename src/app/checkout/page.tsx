'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Check, Crown, Loader2, Zap } from 'lucide-react';

type PlanType = 'pro' | 'enterprise';

interface PlanDetails {
  name: string;
  price: number; // in cents
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
}

const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  pro: {
    name: 'Pro',
    price: 2900, // $29.00
    description: 'Ideal for contractors and frequent permit seekers',
    icon: <Zap className="h-8 w-8" />,
    color: 'from-blue-500 to-blue-600',
    features: [
      '40 searches per month',
      'Advanced filtering and sorting',
      'Distance-based search results',
      'Detailed office information',
      'Phone and email support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 9900, // $99.00
    description: 'Perfect for large teams and organizations',
    icon: <Crown className="h-8 w-8" />,
    color: 'from-purple-500 to-purple-600',
    features: [
      'Unlimited searches',
      'Save favorite offices',
      'Export search results',
      'Priority customer support',
      'Team collaboration features',
      'API access for integrations',
      'Advanced analytics dashboard',
      'Dedicated account manager',
    ],
  },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const planParam = searchParams.get('plan') as PlanType | null;
  const plan = planParam && (planParam === 'pro' || planParam === 'enterprise') ? planParam : null;

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (status === 'unauthenticated') {
      router.push(`/sign-in?callbackUrl=/checkout${plan ? `?plan=${plan}` : ''}`);
    }
  }, [status, router, plan]);

  useEffect(() => {
    // Redirect to pricing if no valid plan is selected
    if (status === 'authenticated' && !plan) {
      router.push('/pricing');
    }
  }, [status, plan, router]);

  const handleCheckout = async () => {
    if (!plan) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!plan || status !== 'authenticated') {
    return null;
  }

  const planDetails = PLAN_DETAILS[plan];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <Button
              onClick={() => router.push('/pricing')}
              variant="outline"
              className="flex items-center space-x-2"
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Pricing</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className={`p-3 rounded-full bg-gradient-to-r ${planDetails.color} text-white`}>
                {planDetails.icon}
              </div>
              <div>
                <div className="text-2xl">{planDetails.name} Plan</div>
                <div className="text-sm font-normal text-gray-600">
                  ${(planDetails.price / 100).toFixed(2)}/month
                </div>
              </div>
            </CardTitle>
            <CardDescription>{planDetails.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  What&apos;s included:
                </h3>
                <ul className="space-y-2">
                  {planDetails.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subscription</span>
                  <span className="font-semibold">${(planDetails.price / 100).toFixed(2)}/month</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total due today</span>
                  <span>${(planDetails.price / 100).toFixed(2)}</span>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  By clicking &quot;Continue to Payment&quot;, you&apos;ll be redirected to Stripe&apos;s secure checkout page.
                  Your subscription will automatically renew each month. Cancel anytime from your account dashboard.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  `Continue to Payment`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 font-medium">Loading checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
