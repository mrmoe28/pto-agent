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
  value = "",
  onChange
}: GooglePlacesAutocompleteProps) {
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

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

        // Import the Places library
        await google.maps.importLibrary("places");

        if (inputRef.current) {
          // Create standard Autocomplete with input element
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'geometry', 'address_components'],
            types: ['address']
          });

          // Listen for place selection
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            console.log('Place selected:', place);

            if (place && place.formatted_address) {
              setInputValue(place.formatted_address);
              onChange?.(place.formatted_address);
              onPlaceSelect(place);
            }
          });
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

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="relative" ref={autocompleteRef}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-black ${className}`}
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}
