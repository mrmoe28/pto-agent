'use client';

import React, { useState, useEffect, useRef } from 'react';
import { georgiaCounties, searchCounties, getRegions } from '@/lib/georgia-counties';
import { ChevronDown, Search, MapPin } from 'lucide-react';

interface County {
  name: string;
  region: string;
  majorCities: string[];
}

interface GeorgiaCountySelectorProps {
  value: string;
  onChange: (county: string) => void;
  placeholder?: string;
  className?: string;
}

export default function GeorgiaCountySelector({
  value,
  onChange,
  placeholder = "Select a county or search by city",
  className = ""
}: GeorgiaCountySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCounties, setFilteredCounties] = useState<County[]>(georgiaCounties);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const regions = getRegions();

  useEffect(() => {
    let filtered = georgiaCounties;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = searchCounties(searchTerm);
    }

    // Filter by region
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(county => county.region === selectedRegion);
    }

    setFilteredCounties(filtered);
  }, [searchTerm, selectedRegion]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCountySelect = (county: County) => {
    onChange(county.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getDisplayValue = () => {
    if (value === 'all' || !value) return 'All Counties';
    const county = georgiaCounties.find(c => c.name === value);
    return county ? `${county.name} County` : value;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between hover:border-gray-400 transition-colors"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {getDisplayValue()}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search and Filter Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-3 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* Counties List */}
          <div className="max-h-64 overflow-y-auto">
            {/* All Counties Option */}
            <button
              type="button"
              onClick={() => {
                onChange('all');
                setIsOpen(false);
                setSearchTerm('');
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 ${
                value === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
            >
              <span className="font-medium">All Counties</span>
              <span className="text-xs text-gray-500">Show all results</span>
            </button>

            {filteredCounties.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">No counties found</div>
                <div className="text-xs">Try a different search term</div>
              </div>
            ) : (
              <>
                {filteredCounties.map((county) => (
                  <button
                    key={county.name}
                    type="button"
                    onClick={() => handleCountySelect(county)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 ${
                      value === county.name ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{county.name} County</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {county.region}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">
                          {county.majorCities.slice(0, 2).join(', ')}
                          {county.majorCities.length > 2 && '...'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Footer with count */}
          {filteredCounties.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 px-4 py-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                {filteredCounties.length} {filteredCounties.length === 1 ? 'county' : 'counties'} found
                {searchTerm && ` for "${searchTerm}"`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}