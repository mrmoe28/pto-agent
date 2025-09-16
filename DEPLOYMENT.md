# Vercel Deployment Guide

This guide will help you deploy the Permit Search Landing app to Vercel using best practices.

## Prerequisites

- Vercel account
- GitHub repository with your code
- Database setup (Neon or Supabase)
- API keys for geocoding services

## Environment Variables

Before deploying, you need to set up the following environment variables in Vercel:

### Required Environment Variables

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@hostname:port/database"

# Geocoding API Keys (at least one required)
LOCATIONIQ_ACCESS_TOKEN="your-locationiq-token"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Application Configuration
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

### Optional Environment Variables

```bash
# Supabase Configuration (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Upstash Redis (if using rate limiting)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

## Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

### 2. Configure Environment Variables

1. In your Vercel project dashboard, go to Settings → Environment Variables
2. Add each environment variable from the list above
3. Make sure to set them for Production, Preview, and Development environments

### 3. Database Setup

#### Option A: Neon Database (Recommended)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string and set it as `DATABASE_URL`
4. Run the database seeding API endpoint after deployment

#### Option B: Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Create the permit_offices table using the schema from the API

### 4. API Keys Setup

#### LocationIQ (Recommended - Free tier available)
1. Sign up at [locationiq.com](https://locationiq.com)
2. Get your API token
3. Set as `LOCATIONIQ_ACCESS_TOKEN`

#### Google Maps API (Fallback)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Geocoding API
3. Create an API key
4. Set as `GOOGLE_MAPS_API_KEY`

### 5. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-app.vercel.app`

## Post-Deployment Setup

### 1. Seed the Database

After deployment, you need to populate the database with Georgia permit offices:

```bash
curl -X POST https://your-app.vercel.app/api/permit-offices \
  -H "Content-Type: application/json" \
  -d '{"action": "seed_georgia_data"}'
```

### 2. Verify Deployment

1. Test the geocoding API: `https://your-app.vercel.app/api/geocode`
2. Test the permit offices API: `https://your-app.vercel.app/api/permit-offices`
3. Check the main application functionality

## Vercel Configuration

The app includes a `vercel.json` file with optimized settings:

- **Framework**: Next.js
- **Regions**: `iad1` (US East)
- **Function Timeout**: 30 seconds for API routes
- **Environment**: Production

## Performance Optimizations

The app is configured with several performance optimizations:

- **Image Optimization**: WebP and AVIF formats
- **Compression**: Enabled
- **Bundle Optimization**: SWC minification
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **External Packages**: Neon database serverless package optimization

## Monitoring and Debugging

### Vercel Analytics
- Enable Vercel Analytics in your project dashboard
- Monitor performance and user behavior

### Function Logs
- Check Vercel Function logs for API errors
- Monitor database connection issues
- Watch for missing environment variable warnings

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check if database allows connections from Vercel IPs

2. **API Key Errors**
   - Ensure API keys are valid and have proper permissions
   - Check rate limits on geocoding services

3. **Build Failures**
   - Check Vercel build logs
   - Verify all dependencies are in `package.json`
   - Ensure TypeScript compilation passes

## Scaling Considerations

- **Database**: Consider connection pooling for high traffic
- **Caching**: Implement Redis caching for frequently accessed data
- **CDN**: Vercel automatically provides global CDN
- **Functions**: Monitor function execution time and memory usage

## Security Best Practices

- Never commit environment variables to version control
- Use Vercel's environment variable encryption
- Regularly rotate API keys
- Monitor for suspicious activity in logs
- Use HTTPS only (enabled by default on Vercel)

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test API endpoints individually
4. Check database connectivity
5. Review the application logs in Vercel dashboard
