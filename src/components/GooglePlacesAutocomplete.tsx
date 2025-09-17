'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { PLACES_CONFIG, GOOGLE_API_ERRORS, isGoogleAPIConfigured } from '@/lib/google-apis';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      // Check if Google API is configured
      if (!isGoogleAPIConfigured()) {
        console.warn(GOOGLE_API_ERRORS.NO_API_KEY);
        setIsLoaded(true); // Still show the input, just without autocomplete
        return;
      }

      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        });
        await loader.load();
        
        if (inputRef.current && !autocompleteRef.current) {
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, PLACES_CONFIG);

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place && place.formatted_address) {
              setInputValue(place.formatted_address);
              onChange?.(place.formatted_address);
              onPlaceSelect(place);
            } else {
              console.warn(GOOGLE_API_ERRORS.INVALID_PLACE);
            }
          });
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error(GOOGLE_API_ERRORS.LOAD_FAILED, error);
        setIsLoaded(true); // Still show the input, just without autocomplete
      }
    };

    initializeAutocomplete();
  }, [onPlaceSelect, onChange]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-black ${className}`}
        required
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}
