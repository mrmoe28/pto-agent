import { EnhancedWebScraper, type DetailedOfficeInfo } from './enhanced-web-scraper'

const scraper = new EnhancedWebScraper()

interface CacheEntry {
  value: DetailedOfficeInfo | null
  expires: number
}

const DEFAULT_CACHE_TTL_MS = Number(process.env.SCRAPER_CACHE_TTL_MS ?? 1000 * 60 * 30)
const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<DetailedOfficeInfo | null>>()

function normalizeUrl(url: string): string {
  try {
    const normalized = new URL(url)
    normalized.hash = ''
    return normalized.toString()
  } catch {
    return url
  }
}

export async function getDetailedOfficeInfo(url: string): Promise<DetailedOfficeInfo | null> {
  const key = normalizeUrl(url)
  const now = Date.now()
  const cached = cache.get(key)

  if (cached && cached.expires > now) {
    return cached.value
  }

  const existingPromise = inflight.get(key)
  if (existingPromise) {
    return existingPromise
  }

  const allowDynamic = process.env.ENABLE_DYNAMIC_SCRAPER === 'true'
  const scrapePromise = scraper
    .scrapeDetailedOfficeInfo(key, { allowDynamic })
    .catch(error => {
      console.error('Detailed office scrape failed:', error)
      return null
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, scrapePromise)

  const result = await scrapePromise
  cache.set(key, { value: result, expires: now + DEFAULT_CACHE_TTL_MS })
  return result
}

export function clearScraperCache(): void {
  cache.clear()
  inflight.clear()
}
