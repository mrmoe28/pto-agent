'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedPermitOfficeTable from '@/components/EnhancedPermitOfficeTable';
import { type PlanType, canUserAccessFeature } from '@/lib/subscription-types';

interface UserFavorite {
  id: string;
  userId: string;
  permitOfficeId: string;
  notes: string | null;
  createdAt: string;
}

interface PermitOffice {
  id?: string;
  city: string;
  county: string;
  state: string;
  jurisdiction_type: string;
  department_name: string;
  office_type: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  // Operating hours
  hours_monday?: string | null;
  hours_tuesday?: string | null;
  hours_wednesday?: string | null;
  hours_thursday?: string | null;
  hours_friday?: string | null;
  hours_saturday?: string | null;
  hours_sunday?: string | null;
  // Services
  building_permits?: boolean;
  electrical_permits?: boolean;
  plumbing_permits?: boolean;
  mechanical_permits?: boolean;
  zoning_permits?: boolean;
  planning_review?: boolean;
  inspections?: boolean;
  // Online services
  online_applications?: boolean;
  online_payments?: boolean;
  permit_tracking?: boolean;
  online_portal_url?: string | null;
  // Enhanced information
  permitFees?: {
    building?: { amount?: number; description?: string; unit?: string };
    electrical?: { amount?: number; description?: string; unit?: string };
    plumbing?: { amount?: number; description?: string; unit?: string };
    mechanical?: { amount?: number; description?: string; unit?: string };
    zoning?: { amount?: number; description?: string; unit?: string };
    general?: { amount?: number; description?: string; unit?: string };
  } | null;
  instructions?: {
    general?: string;
    building?: string;
    electrical?: string;
    plumbing?: string;
    mechanical?: string;
    zoning?: string;
    requiredDocuments?: string[];
    applicationProcess?: string;
  } | null;
  downloadableApplications?: {
    building?: string[];
    electrical?: string[];
    plumbing?: string[];
    mechanical?: string[];
    zoning?: string[];
    general?: string[];
  } | null;
  processingTimes?: {
    building?: { min?: number; max?: number; unit?: string; description?: string };
    electrical?: { min?: number; max?: number; unit?: string; description?: string };
    plumbing?: { min?: number; max?: number; unit?: string; description?: string };
    mechanical?: { min?: number; max?: number; unit?: string; description?: string };
    zoning?: { min?: number; max?: number; unit?: string; description?: string };
    general?: { min?: number; max?: number; unit?: string; description?: string };
  } | null;
  // Geographic data
  latitude?: string | null;
  longitude?: string | null;
  serviceAreaBounds?: Record<string, unknown> | null;
  // Metadata
  dataSource?: string;
  lastVerified?: string | null;
  crawlFrequency?: string;
  active?: boolean;
  distance?: number;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const router = useRouter();
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [offices, setOffices] = useState<Record<string, PermitOffice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, setUserPlan] = useState<PlanType>('free');
  const [canAccessFavorites, setCanAccessFavorites] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/sign-in');
      return;
    }

    // Check user's subscription plan
    const subscriptionPlan = user?.subscriptionPlan as PlanType | undefined;
    const plan = subscriptionPlan || 'free';
    setUserPlan(plan);

    // Check if user can access favorites (Enterprise only)
    const canAccess = canUserAccessFeature(plan, 'canSaveFavorites');
    setCanAccessFavorites(canAccess);

    if (canAccess) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [user, isLoaded, router]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/favorites');

      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const favoritesData = await response.json();
      setFavorites(favoritesData);

      // Fetch office details for each favorite
      const officePromises = favoritesData.map(async (favorite: UserFavorite) => {
        try {
          const officeResponse = await fetch(`/api/permit-offices?id=${favorite.permitOfficeId}`);
          if (officeResponse.ok) {
            const officeData = await officeResponse.json();
            return { id: favorite.permitOfficeId, office: officeData.offices[0] };
          }
        } catch (err) {
          console.error('Error fetching office details:', err);
        }
        return null;
      });

      const officeResults = await Promise.all(officePromises);
      const officeMap: Record<string, PermitOffice> = {};
      
      officeResults.forEach(result => {
        if (result && result.office) {
          officeMap[result.id] = result.office;
        }
      });

      setOffices(officeMap);
    } catch (err) {
      setError('Failed to load favorites');
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove',
          permitOfficeId: favoriteId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      // Refresh the favorites list
      await fetchFavorites();
    } catch (err) {
      setError('Failed to remove favorite');
      console.error('Error removing favorite:', err);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {!canAccessFavorites && (
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Favorites Feature</h3>
                <p className="text-gray-600 mb-4">
                  Save your favorite permit offices for quick access. This feature is available with our Enterprise plan.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/pricing')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                  >
                    Upgrade to Enterprise
                  </button>
                  <button
                    onClick={() => router.push('/search')}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Continue Searching
                  </button>
                </div>
              </div>
            </div>
          )}

          {canAccessFavorites && favorites.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No favorites yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start by searching for permit offices and adding them to your favorites.</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/search')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Search Permit Offices
                </button>
              </div>
            </div>
          ) : canAccessFavorites ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {favorites.length} Favorite{favorites.length !== 1 ? 's' : ''}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favorites.map((favorite) => {
                  const office = offices[favorite.permitOfficeId];
                  if (!office) {
                    return (
                      <div key={favorite.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="text-center text-gray-500">
                          <p>Loading office details...</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={favorite.id} className="relative">
                      <EnhancedPermitOfficeTable offices={[office]} />
                      <button
                        onClick={() => removeFavorite(favorite.permitOfficeId)}
                        className="absolute top-4 right-4 z-10 p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-full transition-colors duration-200"
                        title="Remove from favorites"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {favorite.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-600">
                            <strong>Your Notes:</strong> {favorite.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
