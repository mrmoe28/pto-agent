'use client';

import { useEffect, useRef, useState } from 'react';

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function GooglePlacesAutocomplete({
  onPlaceSelect,
  placeholder = "Enter your property address...",
  className = "",
  value: _value = "",
  onChange
}: GooglePlacesAutocompleteProps) {
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      // Check if Google API is configured
      if (!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
        console.warn('Google Places API key not found. Autocomplete will be disabled.');
        setIsLoaded(true);
        return;
      }

      try {
        console.log('Initializing Google Places Autocomplete with new API...');

        // Import the Places library using the standard API
        const { Autocomplete } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

        if (autocompleteRef.current) {
          // Create the new Autocomplete
          const placeAutocomplete = new Autocomplete({
            locationBias: {
              // Default bias to US
              north: 49.0,
              south: 25.0,
              east: -66.0,
              west: -125.0
            },
            componentRestrictions: { country: 'us' },
            requestedRegionCode: 'us',
            requestedLanguage: 'en',
          });

          // Apply placeholder to the internal input (after element is created)
          placeAutocomplete.setAttribute('placeholder', placeholder);

          // Listen for place selection
          placeAutocomplete.addEventListener('gmp-placeselect', async (event: Event) => {
            const customEvent = event as CustomEvent;
            const place = customEvent.detail?.place;
            console.log('Place selected:', place);

            if (place) {
              try {
                // Fetch necessary fields
                await place.fetchFields({
                  fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
                });

                // Convert to PlaceResult format for compatibility
                const placeResult: google.maps.places.PlaceResult = {
                  formatted_address: place.formattedAddress,
                  geometry: {
                    location: place.location
                  },
                  address_components: place.addressComponents?.map((component: google.maps.places.PlaceAddressComponent) => ({
                    long_name: component.longText,
                    short_name: component.shortText,
                    types: component.types
                  })) || []
                };

                onChange?.(place.formattedAddress || '');
                onPlaceSelect(placeResult);
              } catch (error) {
                console.error('Error fetching place fields:', error);
              }
            }
          });

          // Append the element to our container
          autocompleteRef.current.appendChild(placeAutocomplete);
        }

        setIsLoaded(true);
        console.log('Autocomplete initialized successfully with new API');
      } catch (error) {
        console.error('Failed to load Google Places API:', error);
        setIsLoaded(true);
      }
    };

    initializeAutocomplete();
  }, [onPlaceSelect, onChange, placeholder]);


  return (
    <div className="relative">
      <div
        ref={autocompleteRef}
        className={`w-full ${className}`}
        style={{
          // Ensure the PlaceAutocompleteElement fills the container
          width: '100%'
        }}
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}
      <style jsx global>{`
        /* Style the PlaceAutocompleteElement input */
        gmp-placeautocomplete {
          width: 100%;
        }

        gmp-placeautocomplete input {
          width: 100% !important;
          padding: 0.75rem 1rem !important;
          font-size: 1.125rem !important;
          border: 2px solid #d1d5db !important;
          border-radius: 0.5rem !important;
          color: #000 !important;
        }

        gmp-placeautocomplete input:focus {
          border-color: #3b82f6 !important;
          outline: none !important;
        }
      `}</style>
    </div>
  );
}
