'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionInfo {
  userId: string;
  email: string;
  clerkPlan: string;
  dbPlan: string;
  searchesUsed: number;
  searchesLimit: number | null;
  status: string;
  lastUpdated: string;
}

export default function AdminSubscriptionPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise' | 'admin'>('free');
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if current user is admin
  const isAdmin = user?.email === 'edwardsteel.0@gmail.com';

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            Access denied. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleGetUserInfo = async () => {
    if (!targetUserId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a user ID' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/update-subscription?userId=${targetUserId}`);
      const data = await response.json();

      if (response.ok) {
        setSubscriptionInfo(data);
        setSelectedPlan(data.dbPlan);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to get user info' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    if (!targetUserId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a user ID' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          plan: selectedPlan,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        // Refresh user info
        await handleGetUserInfo();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update subscription' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin - Subscription Management</h1>
        <p className="text-gray-600 mt-2">
          Manage user subscription plans and fix Enterprise subscription issues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Lookup */}
        <Card>
          <CardHeader>
            <CardTitle>Lookup User</CardTitle>
            <CardDescription>
              Enter a user ID to view their current subscription status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="user_xxxxxxxxxxxxx"
              />
            </div>
            <Button 
              onClick={handleGetUserInfo} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Get User Info'}
            </Button>
          </CardContent>
        </Card>

        {/* Update Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Update Subscription</CardTitle>
            <CardDescription>
              Change a user&apos;s subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="plan">Plan</Label>
              <Select value={selectedPlan} onValueChange={(value: 'free' | 'pro' | 'enterprise' | 'admin') => setSelectedPlan(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (1 search)</SelectItem>
                  <SelectItem value="pro">Pro (40 searches/month)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (Unlimited)</SelectItem>
                  <SelectItem value="admin">Admin (Unlimited)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleUpdateSubscription} 
              disabled={loading || !targetUserId.trim()}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Subscription'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      {message && (
        <Alert className={`mt-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          <AlertDescription>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* User Info Display */}
      {subscriptionInfo && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User Subscription Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">User ID</Label>
                <p className="text-sm text-gray-600">{subscriptionInfo.userId}</p>
              </div>
              <div>
                <Label className="font-semibold">Email</Label>
                <p className="text-sm text-gray-600">{subscriptionInfo.email}</p>
              </div>
              <div>
                <Label className="font-semibold">Clerk Plan</Label>
                <p className="text-sm text-gray-600">{subscriptionInfo.clerkPlan}</p>
              </div>
              <div>
                <Label className="font-semibold">Database Plan</Label>
                <p className="text-sm text-gray-600">{subscriptionInfo.dbPlan}</p>
              </div>
              <div>
                <Label className="font-semibold">Searches Used</Label>
                <p className="text-sm text-gray-600">{subscriptionInfo.searchesUsed}</p>
              </div>
              <div>
                <Label className="font-semibold">Search Limit</Label>
                <p className="text-sm text-gray-600">
                  {subscriptionInfo.searchesLimit === null ? 'Unlimited' : subscriptionInfo.searchesLimit}
                </p>
              </div>
              <div>
                <Label className="font-semibold">Status</Label>
                <p className="text-sm text-gray-600">{subscriptionInfo.status}</p>
              </div>
              <div>
                <Label className="font-semibold">Last Updated</Label>
                <p className="text-sm text-gray-600">
                  {new Date(subscriptionInfo.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Plan Mismatch Warning */}
            {subscriptionInfo.clerkPlan !== subscriptionInfo.dbPlan && (
              <Alert className="mt-4 border-yellow-500">
                <AlertDescription>
                  ⚠️ Plan mismatch detected! Clerk shows &quot;{subscriptionInfo.clerkPlan}&quot; but database shows &quot;{subscriptionInfo.dbPlan}&quot;.
                  This is likely the cause of the subscription display issue.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Fix Enterprise Subscription Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Common Issue:</h4>
            <p className="text-sm text-gray-600">
              Users who upgraded to Enterprise may see &quot;0 of null monthly searches&quot; because their Clerk metadata
              wasn&apos;t updated during the upgrade process.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Solution:</h4>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>Look up the user by their User ID (found in Clerk dashboard)</li>
              <li>Check if there&apos;s a plan mismatch between Clerk and database</li>
              <li>Update their subscription to &quot;enterprise&quot; to sync both systems</li>
              <li>The user should now see &quot;Unlimited searches&quot; instead of the error</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
