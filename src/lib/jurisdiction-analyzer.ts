/**
 * Intelligent jurisdiction analyzer to determine the best permit office
 * level (city vs county) based on address characteristics
 */

export interface JurisdictionAnalysis {
  searchLevel: 'city' | 'county' | 'both'
  confidence: 'high' | 'medium' | 'low'
  reason: string
  suggestedOrder: ('city' | 'county')[]
}

interface AddressComponents {
  city: string | null
  county: string | null
  state: string
  addressLine?: string
  postalCode?: string
}

/**
 * Known incorporated cities by state
 * These cities have their own permit departments
 */
const INCORPORATED_CITIES: Record<string, Set<string>> = {
  GA: new Set([
    'Atlanta',
    'Savannah',
    'Augusta',
    'Columbus',
    'Macon',
    'Roswell',
    'Albany',
    'Johns Creek',
    'Warner Robins',
    'Alpharetta',
    'Marietta',
    'Valdosta',
    'Sandy Springs',
    'Smyrna',
    'Dunwoody',
    'Gainesville',
    'Peachtree City',
    'Newnan',
    'Milton',
    'Kennesaw',
    'Duluth',
    'Woodstock',
    'Lawrenceville',
    'Jonesboro',
    'East Point',
    'Statesboro',
    'Rome',
    'Pooler',
    'Decatur'
  ])
}

/**
 * Known unincorporated areas / census-designated places
 * These areas rely on county-level permit departments
 */
const UNINCORPORATED_AREAS: Record<string, Set<string>> = {
  GA: new Set([
    'Chamblee', // Actually incorporated but often confused
    'Conley',
    'Tucker',
    'North Druid Hills',
    'Candler-McAfee',
    'Belvedere Park',
    'Panthersville',
    'Redan',
    'Lithonia', // Partially unincorporated
    'Stone Mountain', // Partially unincorporated
    'Clarkston',
    'Pine Lake',
    'Avondale Estates',
    'Doraville',
    'Scottdale',
    'Brookhaven',
    'Chamblee-Dunwoody',
    'North Atlanta',
    'Vinings'
  ])
}

/**
 * Analyze an address to determine the best jurisdiction level for permit searches
 */
export function analyzeJurisdiction(components: AddressComponents): JurisdictionAnalysis {
  const { city, county, state } = components

  if (!state) {
    return {
      searchLevel: 'both',
      confidence: 'low',
      reason: 'Missing state information',
      suggestedOrder: ['county', 'city']
    }
  }

  if (!city && county) {
    return {
      searchLevel: 'county',
      confidence: 'high',
      reason: 'No city specified, search county level',
      suggestedOrder: ['county']
    }
  }

  if (city && !county) {
    return {
      searchLevel: 'city',
      confidence: 'medium',
      reason: 'City specified without county, try city first',
      suggestedOrder: ['city']
    }
  }

  if (!city && !county) {
    return {
      searchLevel: 'both',
      confidence: 'low',
      reason: 'Missing city and county, search state level',
      suggestedOrder: ['county', 'city']
    }
  }

  // Both city and county available - analyze which is better
  const normalizedCity = city!.trim()
  const normalizedState = state.toUpperCase()

  // Check if it's a known incorporated city
  const incorporatedCities = INCORPORATED_CITIES[normalizedState]
  if (incorporatedCities?.has(normalizedCity)) {
    return {
      searchLevel: 'both',
      confidence: 'high',
      reason: `${normalizedCity} is an incorporated city with its own permit department`,
      suggestedOrder: ['city', 'county']
    }
  }

  // Check if it's a known unincorporated area
  const unincorporatedAreas = UNINCORPORATED_AREAS[normalizedState]
  if (unincorporatedAreas?.has(normalizedCity)) {
    return {
      searchLevel: 'county',
      confidence: 'high',
      reason: `${normalizedCity} is unincorporated, uses ${county} County permit office`,
      suggestedOrder: ['county']
    }
  }

  // Heuristics for unknown cities

  // Small population indicators (likely use county)
  const smallCityPatterns = ['CDP', 'unincorporated', 'community']
  if (smallCityPatterns.some(pattern => normalizedCity.toLowerCase().includes(pattern))) {
    return {
      searchLevel: 'county',
      confidence: 'medium',
      reason: `${normalizedCity} appears to be unincorporated`,
      suggestedOrder: ['county']
    }
  }

  // Large city indicators (likely have own department)
  const largeCityPatterns = ['city', 'municipal', 'metro']
  if (largeCityPatterns.some(pattern => normalizedCity.toLowerCase().includes(pattern))) {
    return {
      searchLevel: 'both',
      confidence: 'medium',
      reason: `${normalizedCity} may have its own permit department`,
      suggestedOrder: ['city', 'county']
    }
  }

  // Default: try both with county priority (safer fallback)
  return {
    searchLevel: 'both',
    confidence: 'medium',
    reason: `${normalizedCity} jurisdiction unknown, trying county first for reliability`,
    suggestedOrder: ['county', 'city']
  }
}

/**
 * Check if a city is likely to have its own permit department
 */
export function isLikelyIncorporated(city: string, state: string): boolean {
  const normalizedState = state.toUpperCase()
  const normalizedCity = city.trim()

  const incorporatedCities = INCORPORATED_CITIES[normalizedState]
  return incorporatedCities?.has(normalizedCity) ?? false
}

/**
 * Check if a city is known to be unincorporated
 */
export function isKnownUnincorporated(city: string, state: string): boolean {
  const normalizedState = state.toUpperCase()
  const normalizedCity = city.trim()

  const unincorporatedAreas = UNINCORPORATED_AREAS[normalizedState]
  return unincorporatedAreas?.has(normalizedCity) ?? false
}

/**
 * Add a city to the incorporated cities list (for dynamic learning)
 */
export function markAsIncorporated(city: string, state: string): void {
  const normalizedState = state.toUpperCase()
  const normalizedCity = city.trim()

  if (!INCORPORATED_CITIES[normalizedState]) {
    INCORPORATED_CITIES[normalizedState] = new Set()
  }

  INCORPORATED_CITIES[normalizedState].add(normalizedCity)
}

/**
 * Add a city to the unincorporated areas list (for dynamic learning)
 */
export function markAsUnincorporated(city: string, state: string): void {
  const normalizedState = state.toUpperCase()
  const normalizedCity = city.trim()

  if (!UNINCORPORATED_AREAS[normalizedState]) {
    UNINCORPORATED_AREAS[normalizedState] = new Set()
  }

  UNINCORPORATED_AREAS[normalizedState].add(normalizedCity)
}
