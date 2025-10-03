'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Crown, 
  ArrowRight, 
  Building2
} from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  limitations: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    description: 'Perfect for getting started with permit office searches',
    icon: <Building2 className="h-8 w-8" />,
    color: 'from-gray-500 to-gray-600',
    features: [
      '1 free search to try our service',
      'Basic address search functionality',
      'View office contact information',
      'Access to public permit data',
      'Email support'
    ],
    limitations: [
      'Limited to 1 search total',
      'No advanced filtering options',
      'No favorites functionality',
      'No export functionality',
      'No priority support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'Ideal for contractors and frequent permit seekers',
    icon: <Zap className="h-8 w-8" />,
    color: 'from-blue-500 to-blue-600',
    popular: true,
    features: [
      '40 searches per month',
      'Advanced filtering and sorting',
      'Distance-based search results',
      'Detailed office information',
      'Phone and email support'
    ],
    limitations: [
      'No favorites functionality',
      'No export functionality',
      'No priority support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    period: 'month',
    description: 'Perfect for large teams and organizations',
    icon: <Crown className="h-8 w-8" />,
    color: 'from-purple-500 to-purple-600',
    features: [
      'Unlimited searches',
      'Everything in Pro',
      'Save favorite offices',
      'Export search results',
      'Priority customer support',
      'Team collaboration features',
      'Custom branding options',
      'API access for integrations',
      'Advanced analytics dashboard',
      'Dedicated account manager',
      'Custom training sessions',
      'SLA guarantee',
      'White-label solutions'
    ],
    limitations: []
  }
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      // Get subscription plan from user metadata
      const subscriptionPlan = user?.subscriptionPlan as string;
      setCurrentPlan(subscriptionPlan || 'free');
    } else {
      setCurrentPlan(null);
    }
  }, [isLoaded, user]);

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (planId === 'free') {
      // Free plan doesn't require payment
      setCurrentPlan('free');
      return;
    }

    setIsLoading(true);
    try {
      // For paid plans, redirect to checkout
      // In a real implementation, this would integrate with Clerk's billing system
      // or a payment processor like Stripe
      router.push(`/checkout?plan=${planId}`);
    } catch (error) {
      console.error('Error selecting plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading pricing plans...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Pricing Plans</h1>
            </div>
            <Button
              onClick={() => router.push(isAuthenticated ? '/dashboard' : '/sign-in')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowRight className={`h-4 w-4 ${isAuthenticated ? 'rotate-180' : ''}`} />
              <span>{isAuthenticated ? 'Back to Dashboard' : 'Sign In'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Choose Your Perfect Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Find the right permit office for your project with our powerful search tools. 
            Start free and upgrade as you grow.
          </p>
          
          {/* Current Plan Badge */}
          {currentPlan && (
            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <Check className="h-4 w-4" />
              <span>Current Plan: {pricingPlans.find(p => p.id === currentPlan)?.name}</span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                plan.popular 
                  ? 'ring-2 ring-blue-500 shadow-2xl scale-105' 
                  : 'shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                  <Star className="h-4 w-4 inline mr-1" />
                  Most Popular
                </div>
              )}
              
              <CardHeader className={`text-center pb-4 ${plan.popular ? 'pt-12' : 'pt-6'}`}>
                <div className={`mx-auto mb-4 p-4 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  {plan.period && <span className="text-gray-600 ml-2">/{plan.period}</span>}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4 mb-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      What&apos;s included:
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        Limitations:
                      </h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-500">
                            <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading || currentPlan === plan.id}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : currentPlan === plan.id ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : null}
                  {currentPlan === plan.id ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Upgrade Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Compare All Features
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                  {pricingPlans.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-6 font-semibold text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Monthly searches</td>
                  <td className="py-4 px-6 text-center text-gray-600">1 total</td>
                  <td className="py-4 px-6 text-center text-gray-600">40</td>
                  <td className="py-4 px-6 text-center text-gray-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Advanced filtering</td>
                  <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Favorites</td>
                  <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Export results</td>
                  <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">Priority support</td>
                  <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-gray-900">API access</td>
                  <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-red-500 mx-auto" /></td>
                  <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">Yes, our Free plan gives you access to basic features with no time limit.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600">We accept all major credit cards for Enterprise plans.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. No cancellation fees.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
