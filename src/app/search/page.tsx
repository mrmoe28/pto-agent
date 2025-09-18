'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';
import PermitOfficeTable from '@/components/PermitOfficeTable';
import { extractAddressComponents, getCoordinates } from '@/lib/google-apis';

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
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PermitOffice[]>([]);
  const [error, setError] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

  const isAuthenticated = !!user;

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place);
    setAddress(place.formatted_address || '');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      let latitude: number;
      let longitude: number;
      let city = '';
      let county = '';
      let state = 'GA';

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
      
      // Search for permit offices
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lng: longitude.toString(),
        city: city,
        county: county,
        state: state
      });


      const officesResponse = await fetch(`/api/permit-offices?${params}`);
      
      if (!officesResponse.ok) {
        throw new Error('Could not find permit offices');
      }

      const officesData = await officesResponse.json();
      setResults(officesData.offices || []);

      if (officesData.offices.length === 0) {
        setError('No permit offices found for this location. Try a different address.');
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
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                ← Back to Dashboard
              </button>
            ) : (
              <button
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
                <p className="mt-2 text-sm text-gray-500">
                  💡 Start typing to see address suggestions from Google
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Find Permit Offices'}
              </button>
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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Found {results.length} Permit Office{results.length !== 1 ? 's' : ''}
        </h2>
        <PermitOfficeTable offices={results} />
      </div>
    )}
        </div>
      </main>
    </div>
  );
}
