'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  ArrowLeft, 
  Building2, 
  Zap, 
  Crown, 
  CreditCard,
  Shield,
  Lock
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
}

const plans: Record<string, Plan> = {
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'Ideal for contractors and frequent permit seekers',
    icon: <Zap className="h-8 w-8" />,
    color: 'from-blue-500 to-blue-600',
    features: [
      'Unlimited permit office searches',
      'Advanced filtering and sorting',
      'Save favorite offices',
      'Distance-based search results',
      'Detailed office information',
      'Phone and email support',
      'Export search results',
      'Priority customer support'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    period: 'month',
    description: 'Perfect for large teams and organizations',
    icon: <Crown className="h-8 w-8" />,
    color: 'from-purple-500 to-purple-600',
    features: [
      'Everything in Pro',
      'Team collaboration features',
      'Custom branding options',
      'API access for integrations',
      'Advanced analytics dashboard',
      'Dedicated account manager',
      'Custom training sessions',
      'SLA guarantee',
      'White-label solutions'
    ]
  }
};

function CheckoutPageContent() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (!planId || !plans[planId]) {
      router.push('/pricing');
      return;
    }
  }, [user, isLoaded, router, planId]);

  const selectedPlan = planId ? plans[planId] : null;

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isLoaded || !selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            </div>
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
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${selectedPlan.color} text-white`}>
                    {selectedPlan.icon}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{selectedPlan.name} Plan</CardTitle>
                    <CardDescription>{selectedPlan.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-gray-900">
                      ${selectedPlan.price}
                    </span>
                    <span className="text-gray-600">/{selectedPlan.period}</span>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">What&apos;s included:</h4>
                    <ul className="space-y-2">
                      {selectedPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Information</span>
                </CardTitle>
                <CardDescription>
                  Secure payment powered by Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">Credit Card</span>
                        <Badge variant="secondary" className="ml-auto">
                          <Shield className="h-3 w-3 mr-1" />
                          Secure
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Billing Information */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Billing Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={user?.name || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{selectedPlan.name} Plan</span>
                        <span className="font-medium">${selectedPlan.price}/{selectedPlan.period}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">$0.00</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>${selectedPlan.price}/{selectedPlan.period}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subscribe Button */}
                  <Button
                    onClick={handleSubscribe}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
                  >
                    {isProcessing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Lock className="h-5 w-5" />
                        <span>Subscribe to {selectedPlan.name}</span>
                      </div>
                    )}
                  </Button>

                  {/* Security Notice */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>Your payment information is secure and encrypted</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
