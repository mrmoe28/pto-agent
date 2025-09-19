# Environment Variable Verification Rule

## CRITICAL: Always Verify Environment Variables Before Deployment

### Rule: Before any deployment or troubleshooting, ALWAYS check that all required environment variables are present in both local and production environments.

## Required Environment Variables Checklist

### Database & Backend
- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `DATABASE_URL_UNPOOLED` - Neon unpooled connection string
- [ ] `NEON_PROJECT_ID` - Neon project identifier

### Authentication (Clerk)
- [ ] `CLERK_SECRET_KEY` - Server-side Clerk secret key
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Client-side Clerk public key
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Clerk sign-in URL
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` - Clerk sign-up redirect
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` - Clerk sign-in redirect

### Google APIs (CRITICAL FOR SEARCH FUNCTIONALITY)
- [ ] `GOOGLE_MAPS_API_KEY` - Google Maps API key
- [ ] `GOOGLE_PLACES_API_KEY` - Google Places API key
- [ ] `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` - Public Google Places API key
- [ ] `GOOGLE_CUSTOM_SEARCH_API_KEY` - Google Custom Search API key (REQUIRED FOR WEB SEARCH)
- [ ] `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` - Google Custom Search Engine ID (REQUIRED FOR WEB SEARCH)

### AI & External Services
- [ ] `OPENAI_API_KEY` - OpenAI API key for AI features
- [ ] `STACK_SECRET_SERVER_KEY` - Stack secret key
- [ ] `NEXT_PUBLIC_STACK_PROJECT_ID` - Stack project ID
- [ ] `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` - Stack public key

### OAuth (if applicable)
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [ ] `NEXTAUTH_SECRET` - NextAuth secret key
- [ ] `NEXTAUTH_URL` - NextAuth URL

## Verification Commands

### 1. Check Local Environment Files
```bash
# Check .env file
grep -E "^(GOOGLE_|CLERK_|DATABASE_|OPENAI_|STACK_)" .env

# Check .env.production file
grep -E "^(GOOGLE_|CLERK_|DATABASE_|OPENAI_|STACK_)" .env.production

# Check .env.local file
grep -E "^(GOOGLE_|CLERK_|DATABASE_|OPENAI_|STACK_)" .env.local
```

### 2. Check Vercel Production Environment
```bash
# List all environment variables
vercel env ls

# Check specific Google APIs
vercel env ls | grep -i google

# Check Clerk variables
vercel env ls | grep -i clerk

# Check database variables
vercel env ls | grep -i database
```

### 3. Test API Endpoints
```bash
# Test permit offices API
curl -X GET "https://your-app.vercel.app/api/permit-offices?city=TestCity&state=GA" -H "Content-Type: application/json"

# Test geocoding API
curl -X GET "https://your-app.vercel.app/api/geocode?address=123 Main St, Atlanta, GA" -H "Content-Type: application/json"
```

## Common Issues & Solutions

### Issue: API returns empty results
**Check:** Google Custom Search API keys are missing from production
**Solution:** 
```bash
vercel env add GOOGLE_CUSTOM_SEARCH_API_KEY production
vercel env add GOOGLE_CUSTOM_SEARCH_ENGINE_ID production
```

### Issue: Database connection fails
**Check:** DATABASE_URL is correct and accessible
**Solution:** Verify Neon database connection and credentials

### Issue: Authentication doesn't work
**Check:** All Clerk environment variables are present
**Solution:** Ensure both secret and public keys are set

## Pre-Deployment Checklist

Before ANY deployment, run these commands:

1. **Verify Local Environment:**
   ```bash
   source .env && node check-database.js
   ```

2. **Verify Production Environment:**
   ```bash
   vercel env ls | grep -E "(GOOGLE_|CLERK_|DATABASE_)"
   ```

3. **Test API Endpoints:**
   ```bash
   curl -X GET "https://your-app.vercel.app/api/permit-offices?state=GA"
   ```

4. **Check for Missing Keys:**
   - Compare local .env with production environment
   - Ensure all Google API keys are present
   - Verify database connection strings

## Emergency Fix Commands

If environment variables are missing:

```bash
# Add Google Custom Search (most common missing keys)
echo "YOUR_API_KEY" | vercel env add GOOGLE_CUSTOM_SEARCH_API_KEY production
echo "YOUR_ENGINE_ID" | vercel env add GOOGLE_CUSTOM_SEARCH_ENGINE_ID production

# Pull updated environment variables
vercel env pull .env.production

# Redeploy to pick up new environment variables
vercel --prod
```

## Remember: 
- **Google Custom Search API keys are CRITICAL** for the web search fallback functionality
- **Database connection** must be verified before troubleshooting data issues
- **Always test API endpoints** after environment variable changes
- **Environment variables are case-sensitive** and must match exactly

This rule should be followed for EVERY deployment and troubleshooting session.
