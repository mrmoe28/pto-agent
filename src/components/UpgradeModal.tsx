'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, Crown } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'free' | 'pro' | 'enterprise' | 'admin';
  searchesUsed: number;
  searchesLimit: number | null;
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentPlan, 
  searchesUsed, 
  searchesLimit 
}: UpgradeModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    try {
      // Redirect to checkout page
      router.push(`/checkout?plan=${planId}`);
    } catch (error) {
      console.error('Error upgrading plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPricing = () => {
    router.push('/pricing');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {currentPlan === 'free' ? 'Upgrade to Continue Searching' : 'Upgrade for More Searches'}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            {currentPlan === 'free'
              ? `You've used ${searchesUsed} of ${searchesLimit} free search${searchesLimit === 1 ? '' : 'es'}. Upgrade to Pro for 40 searches per month!`
              : currentPlan === 'pro'
                ? `You've used ${searchesUsed} of ${searchesLimit} monthly searches. Upgrade to Enterprise for unlimited searches!`
                : currentPlan === 'enterprise'
                  ? `You have unlimited searches with your Enterprise plan!`
                  : `You've used ${searchesUsed} of ${searchesLimit || '∞'} monthly searches.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Usage Display */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 mb-2">Current Usage</div>
            <div className="text-2xl font-bold text-gray-900">
              {searchesLimit === null 
                ? `${searchesUsed} searches used (Unlimited)`
                : `${searchesUsed} / ${searchesLimit} searches used`
              }
            </div>
            {searchesLimit && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    searchesUsed >= searchesLimit ? 'bg-red-500' : 
                    searchesUsed / searchesLimit > 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (searchesUsed / searchesLimit) * 100)}%` }}
                />
              </div>
            )}
            {searchesLimit === null && (
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full w-full" />
              </div>
            )}
          </div>

          {/* Upgrade Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pro Plan */}
            <Card className={`relative ${currentPlan === 'free' ? 'ring-2 ring-blue-500' : ''}`}>
              {currentPlan === 'free' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Recommended
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <Zap className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Pro</CardTitle>
                <CardDescription className="text-gray-600">
                  Perfect for contractors and frequent permit seekers
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$29</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    40 searches per month
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Advanced filtering and sorting
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Distance-based search results
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Detailed office information
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Phone and email support
                  </div>
                </div>

                <Button
                  onClick={() => handleUpgrade('pro')}
                  disabled={isLoading || currentPlan === 'pro'}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  {isLoading ? 'Processing...' : currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className={`relative ${currentPlan === 'pro' ? 'ring-2 ring-purple-500' : ''}`}>
              {currentPlan === 'pro' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Recommended
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <Crown className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Enterprise</CardTitle>
                <CardDescription className="text-gray-600">
                  Perfect for large teams and organizations
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$99</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Unlimited searches
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Everything in Pro
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Save favorite offices
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Export search results
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Priority customer support
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    API access
                  </div>
                </div>

                <Button
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={isLoading || currentPlan === 'enterprise'}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                >
                  {isLoading ? 'Processing...' : currentPlan === 'enterprise' ? 'Current Plan' : currentPlan === 'free' ? 'Need unlimited? Go Enterprise' : 'Upgrade to Enterprise'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleViewPricing}
              variant="outline"
              className="flex-1"
            >
              View All Plans
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
