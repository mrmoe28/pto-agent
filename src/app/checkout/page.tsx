'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SquarePaymentForm } from '@/components/SquarePaymentForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Check, Crown, Zap } from 'lucide-react';
import Script from 'next/script';

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
  const [squareLoaded, setSquareLoaded] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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

  const handlePaymentSuccess = (subscriptionId: string, cardId: string) => {
    console.log('Payment successful:', { subscriptionId, cardId });
    setPaymentSuccess(true);

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard?subscription=success');
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
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

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-green-100">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Welcome to the {planDetails.name} plan. Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Load Square.js */}
      <Script
        src="https://web.squarecdn.com/v1/square.js"
        onLoad={() => setSquareLoaded(true)}
        strategy="afterInteractive"
      />

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
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Pricing</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Plan Summary */}
            <div>
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
                <CardContent>
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
                        By subscribing, you agree to our terms of service. Your subscription will automatically renew each month.
                        Cancel anytime from your account dashboard.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div>
              {!squareLoaded ? (
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Loading payment form...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <SquarePaymentForm
                  amount={planDetails.price}
                  plan={plan}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
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
