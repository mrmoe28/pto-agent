'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';
import GeorgiaCountySelector from '@/components/GeorgiaCountySelector';
import SimplePermitOfficeDisplay from '@/components/SimplePermitOfficeDisplay';
import UpgradeModal from '@/components/UpgradeModal';
import ExportButton from '@/components/ExportButton';
import { extractAddressComponents, getCoordinates } from '@/lib/google-apis';
import { type PlanType } from '@/lib/subscription-types';

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

export default function SearchPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedPermitType, setSelectedPermitType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PermitOffice[]>([]);
  const [error, setError] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Subscription tracking state
  const [userPlan, setUserPlan] = useState<PlanType>('free');
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [searchesLimit, setSearchesLimit] = useState<number | null>(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);

  const isAuthenticated = !!user;

  // Load user subscription data
  useEffect(() => {
    const loadUserSubscription = async () => {
      if (!isLoaded || !user) {
        setSubscriptionLoaded(true);
        return;
      }

      try {
        const response = await fetch('/api/subscription/check');
        if (response.ok) {
          const data = await response.json();
          setUserPlan(data.plan);
          setSearchesUsed(data.usage.used);
          setSearchesLimit(data.usage.limit);
        }
      } catch (error) {
        console.error('Error loading user subscription:', error);
      } finally {
        setSubscriptionLoaded(true);
      }
    };

    loadUserSubscription();
  }, [isLoaded, user]);

  // County state will be managed by the GeorgiaCountySelector component

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place);
    setAddress(place.formatted_address || '');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() && !selectedCounty) return;

    // Set search query for export functionality
    const query = address.trim() || selectedCounty;
    setSearchQuery(query);

    // Check usage limits for authenticated users
    if (isAuthenticated && user) {
      const response = await fetch('/api/subscription/check', { method: 'POST' });

      if (response.ok) {
        const data = await response.json();

        // Show upgrade modal if user cannot search
        if (!data.success || !data.canSearch) {
          setShowUpgradeModal(true);
          setSearchesUsed(data.usage.used); // Update usage display even when showing modal
          return;
        }

        // Update local state with new usage
        setSearchesUsed(data.usage.used);
      } else {
        // If API call fails, still allow the search but log the error
        console.error('Failed to check subscription limits');
      }
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      let city = '';
      let county = '';
      let state = 'GA';

      // If we have an address, get coordinates and location data
      if (address.trim()) {
        // Use Google Places data if available, otherwise fallback to geocoding
        if (selectedPlace && selectedPlace.geometry?.location) {
          const coords = getCoordinates(selectedPlace);
          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
          } else {
            throw new Error('Could not get coordinates from selected place');
          }
          
          // Extract address components using our utility function
          const addressComponents = extractAddressComponents(selectedPlace);
          city = addressComponents.city;
          county = addressComponents.county;
          state = addressComponents.state;
        } else {
          // Fallback to geocoding API
          const geocodeResponse = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
          });

          if (!geocodeResponse.ok) {
            throw new Error('Could not find location for that address');
          }

          const geocodeData = await geocodeResponse.json();
          latitude = geocodeData.latitude;
          longitude = geocodeData.longitude;
          city = geocodeData.city || '';
          county = geocodeData.county || '';
          state = geocodeData.state || 'GA';
        }
      }
      
      // Search for permit offices
      const params = new URLSearchParams({
        city: city,
        county: selectedCounty === 'all' ? '' : (selectedCounty || county), // Use selected county if provided, otherwise use detected county
        state: state
      });

      // Only add coordinates if we have them
      if (latitude !== undefined && longitude !== undefined) {
        params.append('lat', latitude.toString());
        params.append('lng', longitude.toString());
      }


      const officesResponse = await fetch(`/api/permit-offices?${params}`);
      
      if (!officesResponse.ok) {
        throw new Error('Could not find permit offices');
      }

      const officesData = await officesResponse.json();

      if (!officesData.success) {
        setError(officesData.error || 'Unable to search permit offices at this time.');
        setResults([]);
        return;
      }

      setResults(officesData.offices || []);

      if (officesData.offices.length === 0) {
        setError(officesData.message || 'No permit offices found for this location. Try a different address.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Search Permit Offices</h1>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                ← Back to Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/sign-in')}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                Sign in to manage searches →
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search Form */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Property Address
                  </label>
                  <GooglePlacesAutocomplete
                    onPlaceSelect={handlePlaceSelect}
                    value={address}
                    onChange={setAddress}
                    placeholder="Start typing your address..."
                    className="w-full"
                  />
                  <p className="mt-2 text-sm text-gray-500 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Start typing to see address suggestions from Google
                  </p>
                </div>

                <div>
                  <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
                    County (Optional)
                  </label>
                  <GeorgiaCountySelector
                    value={selectedCounty}
                    onChange={setSelectedCounty}
                    placeholder="Select a county or search by city"
                    className="w-full"
                  />
                  <p className="mt-2 text-sm text-gray-500 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Filter by specific county or search all
                  </p>
                </div>

                <div>
                  <label htmlFor="permitType" className="block text-sm font-medium text-gray-700 mb-2">
                    Permit Type
                  </label>
                  <select
                    id="permitType"
                    value={selectedPermitType}
                    onChange={(e) => setSelectedPermitType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Permits</option>
                    <option value="building">Building Permits</option>
                    <option value="electrical">Electrical Permits</option>
                    <option value="plumbing">Plumbing Permits</option>
                    <option value="mechanical">Mechanical Permits</option>
                    <option value="zoning">Zoning Permits</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-500 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Show only data for specific permit type
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Find Permit Offices'}
                </button>
                
                {selectedCounty && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddress('');
                      setSelectedPlace(null);
                      handleSearch({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Searching...' : `Search ${selectedCounty} County`}
                  </button>
                )}
              </div>
            </form>
          </div>

          {!isAuthenticated && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
              <p className="font-semibold">Searching as a guest</p>
              <p className="text-sm text-blue-700">
                You can look up permit offices without an account. Sign in to save searches and manage favorites.
              </p>
            </div>
          )}

          {isAuthenticated && subscriptionLoaded && (
            <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {userPlan === 'free' ? 'Free Plan' : userPlan === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {searchesLimit === null 
                      ? 'Unlimited searches' 
                      : `${searchesUsed} / ${searchesLimit} searches used this month`
                    }
                  </p>
                </div>
                {searchesLimit !== null && (
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          searchesUsed >= searchesLimit ? 'bg-red-500' : 
                          searchesUsed / searchesLimit > 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, (searchesUsed / searchesLimit) * 100)}%` }}
                      />
                    </div>
                    {searchesUsed >= searchesLimit && (
                      <button
                        type="button"
                        onClick={() => setShowUpgradeModal(true)}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Results Display */}
    {results.length > 0 && (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Found {results.length} Permit Office{results.length !== 1 ? 's' : ''}
          </h2>
          <p className="text-gray-600">Scroll down to view all information for each office</p>
          <div className="mt-4">
            <ExportButton 
              searchResults={results} 
              searchQuery={searchQuery}
              size="default"
            />
          </div>
        </div>
        <div className="space-y-12">
          <SimplePermitOfficeDisplay offices={results} permitTypeFilter={selectedPermitType} />
        </div>
      </div>
    )}
        </div>
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={userPlan}
        searchesUsed={searchesUsed}
        searchesLimit={searchesLimit}
      />
    </div>
  );
}
