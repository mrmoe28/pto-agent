'use client'

import { useState } from 'react'
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete'
import SimplePermitOfficeDisplay from './SimplePermitOfficeDisplay'
import { extractAddressComponents, getCoordinates } from '@/lib/google-apis'

interface PermitFeeDetail {
  amount?: number
  description?: string
  unit?: string
}

interface ProcessingTimesRecord {
  min?: number
  max?: number
  unit?: string
  description?: string
}

interface PermitOffice {
  id?: string
  city: string
  county: string
  state: string
  jurisdiction_type: string
  department_name: string
  departmentName?: string
  office_type: string
  address: string
  phone: string | null
  email: string | null
  website: string | null
  // Operating hours
  hours_monday?: string | null
  hours_tuesday?: string | null
  hours_wednesday?: string | null
  hours_thursday?: string | null
  hours_friday?: string | null
  hours_saturday?: string | null
  hours_sunday?: string | null
  // Services
  building_permits?: boolean
  buildingPermits?: boolean
  electrical_permits?: boolean
  electricalPermits?: boolean
  plumbing_permits?: boolean
  plumbingPermits?: boolean
  mechanical_permits?: boolean
  mechanicalPermits?: boolean
  zoning_permits?: boolean
  zoningPermits?: boolean
  planning_review?: boolean
  planningReview?: boolean
  inspections?: boolean
  // Online services
  online_applications?: boolean
  onlineApplications?: boolean
  online_payments?: boolean
  onlinePayments?: boolean
  permit_tracking?: boolean
  permitTracking?: boolean
  online_portal_url?: string | null
  onlinePortalUrl?: string | null
  // Enhanced information
  permitFees?: {
    building?: PermitFeeDetail
    electrical?: PermitFeeDetail
    plumbing?: PermitFeeDetail
    mechanical?: PermitFeeDetail
    zoning?: PermitFeeDetail
    general?: PermitFeeDetail
  } | null
  instructions?: {
    general?: string
    building?: string
    electrical?: string
    plumbing?: string
    mechanical?: string
    zoning?: string
    requiredDocuments?: string[]
    applicationProcess?: string
  } | null
  downloadableApplications?: {
    building?: string[]
    electrical?: string[]
    plumbing?: string[]
    mechanical?: string[]
    zoning?: string[]
    general?: string[]
  } | null
  processingTimes?: {
    building?: ProcessingTimesRecord
    electrical?: ProcessingTimesRecord
    plumbing?: ProcessingTimesRecord
    mechanical?: ProcessingTimesRecord
    zoning?: ProcessingTimesRecord
    general?: ProcessingTimesRecord
  } | null
  // Geographic data
  latitude?: string | null
  longitude?: string | null
  serviceAreaBounds?: Record<string, unknown> | null
  // Metadata
  dataSource?: string
  lastVerified?: string | null
  crawlFrequency?: string
  active?: boolean
  distance?: number
}

export default function Hero() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PermitOffice[]>([])
  const [error, setError] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    setLoading(true)
    setError('')
    setResults([])

    try {
      let geocodeData

      // If we have a selected place from Google Places, use that data directly
      if (selectedPlace && selectedPlace.formatted_address) {
        const coordinates = getCoordinates(selectedPlace)
        const addressComponents = extractAddressComponents(selectedPlace)
        
        if (coordinates) {
          geocodeData = {
            success: true,
            source: 'google_places',
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            formatted_address: selectedPlace.formatted_address,
            city: addressComponents.city,
            county: addressComponents.county,
            state: addressComponents.state
          }
        } else {
          throw new Error('Could not get coordinates from selected place')
        }
      } else {
        // Fallback to geocoding API for manual input
        const geocodeResponse = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        })

        if (!geocodeResponse.ok) {
          throw new Error('Could not find location for that address')
        }

        geocodeData = await geocodeResponse.json()
      }
      
      // Step 2: Search for permit offices
      const params = new URLSearchParams({
        lat: geocodeData.latitude.toString(),
        lng: geocodeData.longitude.toString(),
        city: geocodeData.city || '',
        county: geocodeData.county || '',
        state: geocodeData.state || 'GA'
      })


      const officesResponse = await fetch(`/api/permit-offices?${params}`)
      
      if (!officesResponse.ok) {
        const errorData = await officesResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || `Server error: ${officesResponse.status}`
        throw new Error(errorMessage)
      }

      const officesData = await officesResponse.json()

      if (!officesData.success) {
        setError(officesData.error || 'Unable to search permit offices at this time.')
        setResults([])
        return
      }

      setResults(officesData.offices || [])

      if (officesData.offices.length === 0) {
        setError(officesData.message || 'No permit offices found for this location. Try a different address.')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place)
    setAddress(place.formatted_address || '')
  }

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Content */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Local
            <span className="text-blue-600 block">Permit Office</span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Get instant access to electrical and solar permits, planning services, and zoning information
            for any location in Georgia. Find contact details, hours, and application instructions.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-16">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <GooglePlacesAutocomplete
                onPlaceSelect={handlePlaceSelect}
                value={address}
                onChange={setAddress}
                placeholder="Enter your property address..."
                className="w-full"
              />
              <p className="mt-2 text-sm text-gray-600 text-center flex items-center justify-center">
                <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Start typing to see address suggestions from Google
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Searching...' : 'Find Permit Offices'}
            </button>
          </form>
        </div>

        {/* Error/Info Display */}
        {error && (
          <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-lg ${
            error.includes('collecting') || error.includes('Check back')
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`flex items-start gap-3 ${
              error.includes('collecting') || error.includes('Check back')
                ? 'text-amber-800'
                : 'text-red-700'
            }`}>
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {error.includes('collecting') || error.includes('Check back') ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                )}
              </svg>
              <div className="flex-1">
                <p className="font-medium mb-1">{error}</p>
                {(error.includes('collecting') || error.includes('Check back')) && (
                  <div className="mt-3 space-y-2 text-sm">
                    <p>We&apos;re gathering permit office information for your location. This typically takes 1-2 minutes.</p>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent"></div>
                      <span>Processing your request...</span>
                    </div>
                    <button
                      onClick={handleSearch}
                      className="mt-2 text-amber-700 underline hover:text-amber-900"
                    >
                      Click to refresh and check for results
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results.length > 0 && (
          <div className="max-w-7xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Found {results.length} Permit Office{results.length !== 1 ? 's' : ''}
            </h2>
            <SimplePermitOfficeDisplay offices={results} />
          </div>
        )}

        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Nationwide Coverage</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Instant Results</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Always Up-to-Date</span>
          </div>
        </div>
      </div>
    </section>
  )
}