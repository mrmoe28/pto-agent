# Frontend-Backend Communication Verification Checklist

## ✅ Current Integration Status

### 1. Database Schema & API Alignment ✓
- **Database Tables**: Properly defined in `/src/lib/db/schema.ts`
  - `permitOffices`: Main data table with all office information
  - `userProfiles`: User profile management (Clerk integration)
  - `userFavorites`: User saved offices
  - `userPermitSearches`: Search history
- **API Response Format**: Matches database schema with proper type conversions
- **Type Safety**: TypeScript interfaces exported and used consistently

### 2. API Endpoints ✓

#### `/api/permit-offices` (GET/POST)
- **GET**: Search offices by location, city, county, state
  - ✅ Database query with Drizzle ORM
  - ✅ Fallback to static Georgia data if DB fails
  - ✅ Distance calculation using Haversine formula
  - ✅ Returns enriched data (fees, instructions, processing times)
- **POST**: Seed database with Georgia data
  - ✅ Upsert operation with conflict resolution
  - ✅ Proper error handling

#### `/api/geocode` (POST)
- ✅ Dual-provider support (LocationIQ primary, Google fallback)
- ✅ Returns standardized location data
- ✅ Extracts city, county, state properly

#### `/api/user/profile` (GET/POST/PUT)
- ✅ Clerk authentication integration
- ✅ CRUD operations for user profiles
- ✅ Proper authorization checks

#### `/api/user/favorites` (GET/POST/DELETE)
- ✅ User favorites management
- ✅ Links to permit offices via UUID

### 3. Frontend Components ✓

#### Hero Component (`/src/components/Hero.tsx`)
- ✅ Makes API calls to `/api/geocode` and `/api/permit-offices`
- ✅ Handles Google Places autocomplete integration
- ✅ Proper error handling and loading states
- ✅ Displays enriched office data (fees, instructions, etc.)

### 4. Environment Variables ✓
All required environment variables are documented:
- Supabase configuration
- Clerk authentication
- Geocoding services (LocationIQ, Google Maps)
- Database URL

## 🔧 How to Verify Everything Works

### Step 1: Test Database Connection
```bash
# Check if database is seeded
curl "http://localhost:3000/api/permit-offices?city=Atlanta"
# Should return Atlanta permit offices
```

### Step 2: Test Geocoding
```bash
curl -X POST "http://localhost:3000/api/geocode" \
  -H "Content-Type: application/json" \
  -d '{"address":"Atlanta, GA"}'
# Should return coordinates and location details
```

### Step 3: Test Full Search Flow
1. Go to http://localhost:3000
2. Enter an address in the search box
3. Verify:
   - Autocomplete suggestions appear (Google Places)
   - Search returns nearby permit offices
   - Distance calculations are shown
   - Office details include all enhanced data

### Step 4: Test User Features (requires Clerk sign-in)
```bash
# Test profile endpoints (requires authentication)
curl "http://localhost:3000/api/user/profile" \
  -H "Cookie: [your-auth-cookie]"
```

## 🚨 Common Issues & Solutions

### Issue: No offices returned
**Solution**: Seed the database
```bash
curl -X POST "http://localhost:3000/api/permit-offices" \
  -H "Content-Type: application/json" \
  -d '{"action":"seed_georgia_data"}'
```

### Issue: Geocoding fails
**Solutions**:
1. Check environment variables are set:
   - `LOCATIONIQ_ACCESS_TOKEN`
   - `GOOGLE_MAPS_API_KEY`
2. Verify API keys are valid and have proper permissions

### Issue: Database connection fails
**Solutions**:
1. Check `DATABASE_URL` in `.env`
2. For Supabase: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Fallback to static data should still work

### Issue: Authentication not working
**Solutions**:
1. Verify Clerk environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
2. Check redirect URLs are configured correctly

## ✨ Data Flow Summary

1. **User enters address** → Hero component
2. **Google Places API** → Returns place details with coordinates
3. **Geocode API (fallback)** → LocationIQ/Google Maps geocoding
4. **Permit Offices API** → Queries database with location
5. **Database (Drizzle/Supabase)** → Returns matching offices
6. **Fallback** → Static Georgia data if DB fails
7. **Frontend** → Displays results with distance calculations

## 📊 Database Schema Highlights

The `permit_offices` table includes:
- **Location**: city, county, state, lat/lng coordinates
- **Contact**: phone, email, website, address
- **Hours**: Operating hours for each day
- **Services**: Boolean flags for permit types
- **Online Services**: Portal URL, online applications/payments
- **Enhanced Data**: JSON fields for fees, instructions, processing times
- **Metadata**: Data source, verification status, active flag

All data types properly align between:
- Database schema (`/src/lib/db/schema.ts`)
- API responses (`/src/app/api/permit-offices/route.ts`)
- Frontend types (`/src/components/Hero.tsx`)