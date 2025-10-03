'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ArrowRight, 
  Building2, 
  Zap, 
  Crown, 
  Search,
  Heart,
  Settings
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  icon: React.ReactNode;
  color: string;
}

const plans: Record<string, Plan> = {
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    icon: <Zap className="h-8 w-8" />,
    color: 'from-blue-500 to-blue-600'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    period: 'month',
    icon: <Crown className="h-8 w-8" />,
    color: 'from-purple-500 to-purple-600'
  }
};

function SuccessPageContent() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const [isLoading, setIsLoading] = useState(true);

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

    // Simulate loading time
    setTimeout(() => setIsLoading(false), 1500);
  }, [user, isLoaded, router, planId]);

  const selectedPlan = planId ? plans[planId] : null;

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return null;
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
              <h1 className="text-3xl font-bold text-gray-900">Welcome to {selectedPlan.name}!</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription Successful!
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            You&apos;re all set! Your {selectedPlan.name} plan is now active and you have access to all premium features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Plan Confirmation */}
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full bg-gradient-to-r ${selectedPlan.color} text-white`}>
                  {selectedPlan.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">{selectedPlan.name} Plan</CardTitle>
                  <CardDescription>Active subscription</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    ${selectedPlan.price}
                  </span>
                  <span className="text-gray-600">/{selectedPlan.period}</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
                <p className="text-sm text-gray-600">
                  Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>What&apos;s Next?</CardTitle>
              <CardDescription>
                Start exploring your new features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => router.push('/search')}
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Start Searching Permit Offices
                </Button>
                <Button
                  onClick={() => router.push('/favorites')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  View Your Favorites
                </Button>
                <Button
                  onClick={() => router.push('/profile')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Your Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <Card className="shadow-xl mb-12">
          <CardHeader>
            <CardTitle className="text-center">Your New Features</CardTitle>
            <CardDescription className="text-center">
              Here&apos;s what you can do with your {selectedPlan.name} plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Unlimited Searches</h3>
                <p className="text-sm text-gray-600">
                  Search for permit offices as many times as you need
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Save Favorites</h3>
                <p className="text-sm text-gray-600">
                  Keep track of your most-used permit offices
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Advanced Features</h3>
                <p className="text-sm text-gray-600">
                  Access to filtering, sorting, and export options
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Button
            onClick={() => router.push('/dashboard')}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
