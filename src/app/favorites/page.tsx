'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserFavorite {
  id: string;
  userId: string;
  permitOfficeId: string;
  notes: string | null;
  createdAt: string;
}

interface PermitOffice {
  id: string;
  city: string;
  county: string;
  state: string;
  department_name: string;
  office_type: string;
  address: string;
  phone: string | null;
  website: string | null;
  building_permits: boolean;
  electrical_permits: boolean;
  plumbing_permits: boolean;
  online_applications: boolean;
}

export default function FavoritesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [offices, setOffices] = useState<Record<string, PermitOffice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/sign-in');
      return;
    }

    fetchFavorites();
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

          {favorites.length === 0 ? (
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
          ) : (
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
                    <div key={favorite.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {office.department_name}
                          </h3>
                          <p className="text-gray-600">
                            {office.city}, {office.county} County, {office.state}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFavorite(favorite.permitOfficeId)}
                          className="text-red-600 hover:text-red-800 transition-colors duration-200"
                          title="Remove from favorites"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">{office.address}</span>
                        </div>
                        
                        {office.phone && (
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a href={`tel:${office.phone}`} className="text-sm text-blue-600 hover:underline">
                              {office.phone}
                            </a>
                          </div>
                        )}
                        
                        {office.website && (
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                            <a 
                              href={office.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}

                        {favorite.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">
                              <strong>Notes:</strong> {favorite.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {office.building_permits && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Building</span>
                        )}
                        {office.electrical_permits && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Electrical</span>
                        )}
                        {office.plumbing_permits && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Plumbing</span>
                        )}
                        {office.online_applications && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Online Apps</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
