'use client'

import { useState } from 'react'
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete'
import { extractAddressComponents, getCoordinates } from '@/lib/google-apis'

interface PermitFeeDetail {
  amount?: number
  description?: string
  unit?: string
}

type PermitFeesRecord = Record<string, PermitFeeDetail | undefined>

interface PermitProcessingTime {
  min?: number
  max?: number
  unit?: string
  description?: string
}

type ProcessingTimesRecord = Record<string, PermitProcessingTime | undefined>

type DownloadableApplicationsRecord = Record<string, string[] | undefined>

interface PermitInstructions {
  general?: string
  building?: string
  electrical?: string
  plumbing?: string
  mechanical?: string
  zoning?: string
  requiredDocuments?: string[]
  applicationProcess?: string
  [key: string]: string | string[] | undefined
}

interface PermitOffice {
  id?: string
  city: string
  county: string
  state: string
  department_name?: string
  departmentName?: string
  office_type?: string
  officeType?: string
  address: string
  phone: string | null
  email?: string | null
  website: string | null
  // Operating hours
  hoursMonday?: string | null
  hoursTuesday?: string | null
  hoursWednesday?: string | null
  hoursThursday?: string | null
  hoursFriday?: string | null
  hoursSaturday?: string | null
  hoursSunday?: string | null
  // Services
  online_applications?: boolean
  onlineApplications?: boolean
  building_permits?: boolean
  buildingPermits?: boolean
  electrical_permits?: boolean
  electricalPermits?: boolean
  plumbing_permits?: boolean
  plumbingPermits?: boolean
  mechanicalPermits?: boolean
  zoningPermits?: boolean
  planningReview?: boolean
  inspections?: boolean
  onlinePayments?: boolean
  permitTracking?: boolean
  onlinePortalUrl?: string | null
  // Enhanced data
  permitFees?: PermitFeesRecord | null
  instructions?: PermitInstructions | null
  downloadableApplications?: DownloadableApplicationsRecord | null
  processingTimes?: ProcessingTimesRecord | null
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
        throw new Error('Could not find permit offices')
      }

      const officesData = await officesResponse.json()
      setResults(officesData.offices || [])

      if (officesData.offices.length === 0) {
        setError('No permit offices found for this location. Try searching for a major city like Atlanta, Savannah, or Sandy Springs.')
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
    if (place.formatted_address) {
      setAddress(place.formatted_address)
    }
  }

  const handleAddressChange = (value: string) => {
    setAddress(value)
    // Clear selected place when user types manually
    if (selectedPlace) {
      setSelectedPlace(null)
    }
  }

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Find Your Local <span className="text-blue-600">Permit Office</span> Instantly
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
          Skip the endless phone calls and website searches. Get instant contact information 
          for your local permit office with just your address.
        </p>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <GooglePlacesAutocomplete
              value={address}
              onChange={handleAddressChange}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Enter your property address..."
              className="flex-1"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Find Permit Office'}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
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
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Found {results.length} Permit Office{results.length !== 1 ? 's' : ''}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {results.map((office, index) => {
                const departmentName = office.department_name || office.departmentName || 'Permit Office'
                const buildingPermits = office.building_permits || office.buildingPermits
                const electricalPermits = office.electrical_permits || office.electricalPermits
                const plumbingPermits = office.plumbing_permits || office.plumbingPermits
                const onlineApplications = office.online_applications || office.onlineApplications
                
                return (
                  <div key={office.id || index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {departmentName}
                      </h3>
                      <p className="text-gray-600">
                        {office.city}, {office.county} County, {office.state}
                      </p>
                      {office.distance && (
                        <p className="text-sm text-blue-600 font-medium">
                          {office.distance.toFixed(1)} miles away
                        </p>
                      )}
                    </div>

                    {/* Contact Information */}
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

                      {office.email && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <a href={`mailto:${office.email}`} className="text-sm text-blue-600 hover:underline">
                            {office.email}
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

                      {office.onlinePortalUrl && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <a 
                            href={office.onlinePortalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline font-medium"
                          >
                            Online Portal
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Operating Hours */}
                    {(office.hoursMonday || office.hoursTuesday || office.hoursWednesday || office.hoursThursday || office.hoursFriday) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Operating Hours</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                          {office.hoursMonday && <div>Mon: {office.hoursMonday}</div>}
                          {office.hoursTuesday && <div>Tue: {office.hoursTuesday}</div>}
                          {office.hoursWednesday && <div>Wed: {office.hoursWednesday}</div>}
                          {office.hoursThursday && <div>Thu: {office.hoursThursday}</div>}
                          {office.hoursFriday && <div>Fri: {office.hoursFriday}</div>}
                          {office.hoursSaturday && <div>Sat: {office.hoursSaturday}</div>}
                        </div>
                      </div>
                    )}

                    {/* Processing Times */}
                    {office.processingTimes && Object.keys(office.processingTimes).length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Processing Times</h4>
                        <div className="space-y-1">
                      {Object.entries(office.processingTimes).map(([type, time]: [string, PermitProcessingTime | undefined]) => {
                        if (!time) {
                          return null
                        }

                        const duration = time.min && time.max ? `${time.min}-${time.max}` : time.min ?? time.max

                        return (
                          <div key={type} className="text-xs text-gray-600">
                            <span className="capitalize font-medium">{type}:</span>{' '}
                            {duration}{' '}
                            {time.unit || 'days'}
                            {time.description && <span className="text-gray-500"> - {time.description}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Permit Fees */}
                {office.permitFees && Object.keys(office.permitFees).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Permit Fees</h4>
                    <div className="space-y-1">
                      {Object.entries(office.permitFees).map(([type, fee]: [string, PermitFeeDetail | undefined]) => {
                        if (!fee || fee.amount == null) {
                          return null
                        }

                        return (
                          <div key={type} className="text-xs text-gray-600">
                            <span className="capitalize font-medium">{type}:</span>{' '}
                            ${fee.amount}{fee.unit && `/${fee.unit}`}
                            {fee.description && <span className="text-gray-500"> - {fee.description}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                    {/* Services & Permit Types */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {buildingPermits && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Building</span>
                      )}
                      {electricalPermits && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Electrical</span>
                      )}
                      {plumbingPermits && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Plumbing</span>
                      )}
                      {office.mechanicalPermits && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Mechanical</span>
                      )}
                      {office.zoningPermits && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Zoning</span>
                      )}
                      {office.planningReview && (
                        <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Planning</span>
                      )}
                      {office.inspections && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">Inspections</span>
                      )}
                      {onlineApplications && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Online Apps</span>
                      )}
                      {office.onlinePayments && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Online Pay</span>
                      )}
                      {office.permitTracking && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Tracking</span>
                      )}
                    </div>

                    {/* Instructions */}
                    {office.instructions && office.instructions.general && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Application Instructions</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">{office.instructions.general}</p>
                      </div>
                    )}

                    {/* Downloadable Applications */}
                    {office.downloadableApplications && Object.keys(office.downloadableApplications).length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Application Forms</h4>
                        <div className="space-y-1">
                          {Object.entries(office.downloadableApplications).map(([type, apps]: [string, string[] | undefined]) => {
                            if (!apps || apps.length === 0) {
                              return null
                            }

                            return (
                              <div key={type} className="text-xs">
                                <span className="capitalize font-medium text-gray-700">{type}:</span>
                                <div className="ml-2 space-y-1">
                                  {apps.map((app, appIndex) => (
                                    <a 
                                      key={appIndex}
                                      href={app} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="block text-blue-600 hover:underline"
                                    >
                                      Download Form {appIndex + 1}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
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
