'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Heart, 
  MapPin, 
  Building2, 
  Clock, 
  Star, 
  ChevronRight,
  Settings,
  LogOut,
  User,
  TrendingUp,
  FileText,
  Phone,
  CreditCard
} from 'lucide-react';

interface UserProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  preferences: {
    notifications?: boolean;
    theme?: 'light' | 'dark';
    emailUpdates?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/sign-in');
      return;
    }

    fetchProfile();
  }, [user, isLoaded, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await response.json();
      setProfile(profileData);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : user?.name || 'User';

  const userInitials = userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        {/* Header Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white">
                  Welcome back, {userName.split(' ')[0]}!
                </h1>
              </div>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl">
                Find the perfect permit office for your project. Search, save, and manage your favorite locations all in one place.
              </p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <MapPin className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">500+ Offices</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <Star className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">4.8/5 Rating</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <TrendingUp className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">Live Updates</span>
                </div>
              </div>
            </div>

            {/* User Profile Card */}
            <div className="mt-8 lg:mt-0 lg:ml-8">
              <Card className="w-full max-w-sm bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user?.image || ''} alt={userName} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{userName}</h3>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <Badge variant="secondary" className="mt-1">
                        <User className="h-3 w-3 mr-1" />
                        Premium User
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => router.push('/profile')} 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button 
                      onClick={handleSignOut} 
                      variant="outline" 
                      className="w-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Search Permit Offices */}
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Search Offices</h3>
              <p className="text-gray-600 mb-4">Find permit offices near you with our advanced search tool</p>
              <Button 
                onClick={() => router.push('/search')} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Searching
              </Button>
            </CardContent>
          </Card>

          {/* View Favorites */}
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-pink-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-pink-600 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Favorites</h3>
              <p className="text-gray-600 mb-4">Access your saved permit offices and quick links</p>
              <Button 
                onClick={() => router.push('/favorites')} 
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              >
                View Favorites
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Recent Activity</h3>
              <p className="text-gray-600 mb-4">Track your recent searches and interactions</p>
              <Button 
                onClick={() => router.push('/search')} 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                View Activity
              </Button>
            </CardContent>
          </Card>

          {/* Upgrade Plan */}
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upgrade Plan</h3>
              <p className="text-gray-600 mb-4">Unlock premium features and unlimited searches</p>
              <Button 
                onClick={() => router.push('/pricing')} 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                View Plans
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Quick Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <span>Your Statistics</span>
              </CardTitle>
              <CardDescription>Track your permit office search activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">Searches This Month</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">8</div>
                  <div className="text-sm text-gray-600">Favorites Saved</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">3</div>
                  <div className="text-sm text-gray-600">Offices Visited</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">5</div>
                  <div className="text-sm text-gray-600">Reviews Written</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-green-600" />
                <span>Quick Tips</span>
              </CardTitle>
              <CardDescription>Make the most of your permit office search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Use Location Filters</p>
                    <p className="text-sm text-gray-600">Filter by distance to find offices closest to you</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-green-100 rounded-full">
                    <Heart className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Save Favorites</p>
                    <p className="text-sm text-gray-600">Bookmark offices you visit frequently</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-purple-100 rounded-full">
                    <Phone className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Call Ahead</p>
                    <p className="text-sm text-gray-600">Check office hours and requirements before visiting</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Permit Office?</h2>
            <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              Start your search now and discover permit offices tailored to your specific needs and location.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push('/search')} 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3"
              >
                <Search className="h-5 w-5 mr-2" />
                Start Searching
              </Button>
              <Button 
                onClick={() => router.push('/favorites')} 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-3"
              >
                <Heart className="h-5 w-5 mr-2" />
                View Favorites
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}