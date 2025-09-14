# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL DEVELOPMENT GUIDELINES

### MANDATORY: Feature Documentation Reference
**ALWAYS consult `.claude/commands/features.md` before making ANY changes to this codebase.**

This project has a clearly defined scope and feature set. To prevent scope creep and maintain focus:
1. **DO NOT** add new features, dependencies, or folders without explicit user request
2. **DO NOT** create new components or pages unless directly implementing a documented feature
3. **DO NOT** install packages that aren't already in package.json without explicit approval
4. **ALWAYS** verify any new functionality against the features.md documentation
5. **ALWAYS** stay within the defined project boundaries

### When Building or Modifying:
- ✅ Reference existing features in `.claude/commands/features.md`
- ✅ Use existing dependencies and patterns
- ✅ Maintain the current project structure
- ❌ Do not hallucinate new features
- ❌ Do not create unnecessary abstraction layers
- ❌ Do not add "nice-to-have" features not in the documentation

## Project Overview

This is a **Permit Office Search Application** built with Next.js 15, designed to help users find local permit offices in Georgia. The application features:
- Geocoding services with LocationIQ and Google Maps fallback
- Supabase database integration for permit office data
- Static Georgia permit office data as fallback
- Landing page with Hero, Features, How It Works, and Contact sections

## Technology Stack

- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **APIs**:
  - LocationIQ for geocoding (primary)
  - Google Maps API (fallback)
- **HTTP Client**: Axios
- **Web Scraping**: Cheerio & Playwright

## Common Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Structure

- `/src/app/` - Next.js App Router pages and API routes
  - `/api/permit-offices/` - Permit office search and database seeding endpoints
  - `/api/geocode/` - Geocoding service with dual provider support
- `/src/components/` - React components (Hero, Features, HowItWorks, Contact)
- `/src/lib/` - Utility functions and configurations
  - `supabase.ts` - Supabase client and database types
  - `georgia-permit-data.ts` - Static Georgia permit office data

## Key Architecture Patterns

### API Routes Pattern
The application uses Next.js API routes with the following pattern:
- **GET** endpoints for data retrieval with query parameter filtering
- **POST** endpoints for data mutations
- Fallback to static data when database is unavailable
- Proper error handling with try-catch blocks and appropriate HTTP status codes

### Geocoding Service Architecture
Dual-provider geocoding with automatic fallback:
1. Try LocationIQ first (cost-effective, OpenStreetMap-based)
2. Fall back to Google Maps API if LocationIQ fails
3. Extract city, county, and state from results
4. Return standardized location data regardless of provider

### Database Integration
- Supabase client configured with environment variables
- TypeScript interfaces for database models (`PermitOffice`)
- Upsert operations for data seeding with conflict resolution
- Fallback to static data when database queries fail

## Environment Variables Required

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Geocoding Services
LOCATIONIQ_ACCESS_TOKEN=
GOOGLE_MAPS_API_KEY=
```

## Database Schema

The `permit_offices` table includes:
- Location data (city, county, state, coordinates)
- Office details (department name, type, jurisdiction)
- Contact information (address, phone, email, website)
- Operating hours (per day of week)
- Services offered (various permit types, online services)
- Metadata (data source, verification status, crawl frequency)

## API Endpoints

### `/api/permit-offices`
- **GET**: Search permit offices by location, city, county, or state
  - Query params: `lat`, `lng`, `city`, `county`, `state`
  - Returns offices with calculated distances if coordinates provided
- **POST**: Seed database with Georgia permit office data
  - Body: `{ "action": "seed_georgia_data" }`

### `/api/geocode`
- **POST**: Geocode an address
  - Body: `{ "address": "string" }`
  - Returns: latitude, longitude, formatted address, city, county, state

## Custom Agent Configuration

The project includes a tech-stack-researcher agent in `.claude/agents/` for researching and planning optimal technology stacks, particularly useful for:
- Vercel deployment optimization
- Technology selection for new features
- Performance and scalability planning

## Development Notes

- The application defaults to Georgia (GA) for permit office searches
- Distance calculations use the Haversine formula
- Office search results are limited to 10 by default, ordered by jurisdiction type then city
- The application handles both database and fallback static data seamlessly
- All TypeScript strict mode is enabled for type safety