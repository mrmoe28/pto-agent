/**
 * Google APIs Configuration and Utilities
 * Optimized to use only necessary Google APIs for our application
 */

// Required Google APIs for our application:
// 1. Places API - For address autocomplete
// 2. Maps JavaScript API - Required for Places API to work

export const GOOGLE_APIS_CONFIG = {
  // Only load the libraries we actually need
  libraries: ['places'] as ('places')[],
  
  // Use the latest stable version
  version: 'weekly' as const,
  
  // API key from environment
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '',
  
  // Region and language settings for better results
  region: 'US' as const,
  language: 'en' as const,
};

// Places API configuration
export const PLACES_CONFIG = {
  // Only request address types for our use case
  types: ['address'],
  
  // Only request the fields we actually use
  fields: [
    'formatted_address',
    'geometry',
    'address_components',
    'place_id'
  ],
  
  // Restrict to US addresses only (since we're focused on US permit offices)
  componentRestrictions: {
    country: 'us'
  }
};

// Error messages for better debugging
export const GOOGLE_API_ERRORS = {
  NO_API_KEY: 'Google Places API key is not configured',
  LOAD_FAILED: 'Failed to load Google Places API',
  PLACE_SELECTION_FAILED: 'Failed to select place from autocomplete',
  INVALID_PLACE: 'Invalid place data received'
} as const;

// Helper function to check if Google APIs are properly configured
export function isGoogleAPIConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
}

// Helper function to extract address components from Google Places result
export function extractAddressComponents(place: google.maps.places.PlaceResult) {
  if (!place.address_components) {
    return {
      city: '',
      county: '',
      state: '',
      zipCode: ''
    };
  }

  const components = place.address_components;
  
  return {
    city: components.find(c => c.types.includes('locality'))?.long_name || '',
    county: components.find(c => c.types.includes('administrative_area_level_2'))?.long_name?.replace(' County', '') || '',
    state: components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '',
    zipCode: components.find(c => c.types.includes('postal_code'))?.long_name || ''
  };
}

// Helper function to get coordinates from Google Places result
export function getCoordinates(place: google.maps.places.PlaceResult) {
  if (!place.geometry?.location) {
    return null;
  }

  return {
    latitude: place.geometry.location.lat(),
    longitude: place.geometry.location.lng()
  };
}
