'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Key, 
  Download, 
  BarChart3, 
  Palette, 
  GraduationCap, 
  Users, 
  Heart,
  Shield,
  Loader2,
  ArrowRight
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const router = useRouter();
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    if (isLoaded && user) {
      const subscriptionPlan = user?.subscriptionPlan as string;
      setUserPlan(subscriptionPlan || 'free');
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  const settingsSections = [
    {
      id: 'general',
      title: 'General Settings',
      description: 'Manage your account and preferences',
      icon: Settings,
      href: '/profile',
      available: true,
    },
    {
      id: 'favorites',
      title: 'Favorites Settings',
      description: 'Configure your favorite permit offices',
      icon: Heart,
      href: '/settings/favorites',
      available: userPlan === 'enterprise',
    },
    {
      id: 'teams',
      title: 'Team Management',
      description: 'Manage teams and collaboration settings',
      icon: Users,
      href: '/settings/teams',
      available: userPlan === 'enterprise',
    },
    {
      id: 'export',
      title: 'Export Settings',
      description: 'Configure export formats and preferences',
      icon: Download,
      href: '/settings/export',
      available: userPlan === 'enterprise',
    },
    {
      id: 'api',
      title: 'API Access',
      description: 'Manage API keys and integrations',
      icon: Key,
      href: '/settings/api',
      available: userPlan === 'enterprise',
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'View usage statistics and insights',
      icon: BarChart3,
      href: '/settings/analytics',
      available: userPlan === 'enterprise',
    },
    {
      id: 'branding',
      title: 'Branding & White-label',
      description: 'Customize appearance and branding',
      icon: Palette,
      href: '/settings/branding',
      available: userPlan === 'enterprise',
    },
    {
      id: 'training',
      title: 'Training & Support',
      description: 'Access training materials and support',
      icon: GraduationCap,
      href: '/settings/training',
      available: userPlan === 'enterprise',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and Enterprise features
          </p>
          <div className="mt-4">
            <Badge variant="secondary" className="text-sm">
              Current Plan: {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section) => (
            <Card 
              key={section.id} 
              className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 ${
                !section.available ? 'opacity-50' : ''
              }`}
              onClick={() => section.available ? router.push(section.href) : null}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      section.available 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <section.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                  {section.available ? (
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Shield className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!section.available && (
                  <div className="mt-4">
                    <Badge variant="outline" className="text-xs">
                      Enterprise Only
                    </Badge>
                    <p className="text-xs text-gray-500 mt-2">
                      Upgrade to Enterprise to access this feature
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {userPlan !== 'enterprise' && (
          <div className="mt-12 text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  <Shield className="h-6 w-6 mr-2 text-purple-600" />
                  Unlock All Features
                </CardTitle>
                <CardDescription>
                  Upgrade to Enterprise to access all settings and features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => router.push('/pricing')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  View Pricing Plans
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
