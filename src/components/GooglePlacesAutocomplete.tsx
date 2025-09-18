'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { PLACES_CONFIG, GOOGLE_API_ERRORS, isGoogleAPIConfigured } from '@/lib/google-apis';

// Interface for Google Places API response
interface GooglePlacesPrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      // Check if Google API is configured
      if (!isGoogleAPIConfigured()) {
        console.warn(GOOGLE_API_ERRORS.NO_API_KEY);
        console.warn('Google Places API key not found. Autocomplete will be disabled.');
        setIsLoaded(true); // Still show the input, just without autocomplete
        return;
      }

      try {
        console.log('Initializing Google Places Autocomplete...');
        console.log('API Key available:', !!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY);
        console.log('API Key value:', process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? 'Present' : 'Missing');
        
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        });
        
        await loader.load();
        console.log('Google Maps API loaded successfully');
        
        // Test if google.maps.places is available
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
          throw new Error('Google Maps Places API not available after loading');
        }
        
        if (inputRef.current && !autocompleteRef.current) {
          console.log('Creating autocomplete instance...');
          try {
            autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, PLACES_CONFIG);
            console.log('Autocomplete instance created successfully');

            autocompleteRef.current.addListener('place_changed', () => {
              console.log('Place changed event triggered');
              const place = autocompleteRef.current?.getPlace();
              console.log('Selected place:', place);
              
              if (place && place.formatted_address) {
                setInputValue(place.formatted_address);
                onChange?.(place.formatted_address);
                onPlaceSelect(place);
                console.log('Place selected successfully:', place.formatted_address);
              } else {
                console.warn(GOOGLE_API_ERRORS.INVALID_PLACE, place);
              }
            });
            
            console.log('Autocomplete initialized successfully');
          } catch (autocompleteError) {
            console.error('Failed to create autocomplete instance:', autocompleteError);
            throw autocompleteError;
          }
        } else {
          console.warn('Input ref not available or autocomplete already exists');
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error(GOOGLE_API_ERRORS.LOAD_FAILED, error);
        console.error('Full error details:', error);
        setIsLoaded(true); // Still show the input, just without autocomplete
      }
    };

    initializeAutocomplete();
  }, [onPlaceSelect, onChange]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    
    // If Google Places API is not working, use fallback
    if (newValue.length > 2 && !autocompleteRef.current && process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(newValue)}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&types=address&components=country:us`
        );
        const data = await response.json();
        
        if (data.predictions) {
          const suggestions = data.predictions.map((pred: GooglePlacesPrediction) => pred.description);
          setSuggestions(suggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Fallback autocomplete error:', error);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    onChange?.(suggestion);
    setShowSuggestions(false);
    
    // Get place details for the selected suggestion
    if (process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(suggestion)}&inputtype=textquery&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&fields=place_id,formatted_address,geometry,address_components`
        );
        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
          const place = data.candidates[0];
          // Convert to the expected format
          const placeResult = {
            formatted_address: place.formatted_address,
            geometry: {
              location: {
                lat: () => place.geometry.location.lat,
                lng: () => place.geometry.location.lng
              }
            },
            address_components: place.address_components || []
          };
          onPlaceSelect(placeResult as google.maps.places.PlaceResult);
        }
      } catch (error) {
        console.error('Error getting place details:', error);
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-black ${className}`}
        required
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
