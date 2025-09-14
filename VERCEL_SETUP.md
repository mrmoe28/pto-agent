# Vercel Environment Variables Setup Guide

## Required Environment Variables for Vercel Deployment

Follow these steps to set up your environment variables in Vercel Dashboard:

### 1. Google OAuth Credentials
```
GOOGLE_CLIENT_ID=7731146016-miecdisdk28ef007thqu03mj988gv6d7.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 2. NextAuth Configuration
```
NEXTAUTH_SECRET=E+DBfEaOB942NRXa+r1KQ2zzhgQ/R+959AoN6/7CHKc=
NEXTAUTH_URL=https://your-app-domain.vercel.app
```
**Important:** Replace `your-app-domain` with your actual Vercel deployment URL.

### 3. NEON Database URL
```
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```
**You need to get this from your NEON database dashboard.**

### 4. Optional: Existing API Keys (if already configured)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
LOCATIONIQ_ACCESS_TOKEN=your-locationiq-token
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## How to Set Environment Variables in Vercel

### Option 1: Via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with the appropriate values
5. Set the environment to **Production**, **Preview**, and **Development** as needed

### Option 2: Via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add DATABASE_URL
```

## Google OAuth Console Configuration

### Update Redirect URIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add these to **Authorized redirect URIs**:
   ```
   https://your-app-domain.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google (for development)
   ```
5. Add these to **Authorized JavaScript origins**:
   ```
   https://your-app-domain.vercel.app
   http://localhost:3000 (for development)
   ```

## NEON Database Setup

### 1. Get Your Database URL
1. Go to your [NEON Dashboard](https://console.neon.tech/)
2. Select your project
3. Go to **Dashboard** → **Connection Details**
4. Copy the connection string (it should look like):
   ```
   postgresql://username:password@host/database?sslmode=require
   ```

### 2. Run Database Migrations
You'll need to run the SQL schema on your NEON database:

```bash
# Connect to your NEON database and run the schema
psql "your-database-url" -f user-schema.sql
```

Or manually execute the contents of `user-schema.sql` in your NEON SQL Editor.

## Deployment Checklist

Before deploying to Vercel:

- [ ] All environment variables set in Vercel Dashboard
- [ ] Google OAuth redirect URIs updated with production domain
- [ ] NEON database schema applied
- [ ] `NEXTAUTH_URL` set to your production domain
- [ ] Test authentication flow in Vercel preview deployment

## Testing Your Setup

1. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

2. Test the authentication flow:
   - Visit your deployed app
   - Click sign in
   - Verify Google OAuth works
   - Check user dashboard loads
   - Test profile editing

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**
   - Ensure redirect URIs in Google Console match your Vercel domain exactly
   - Check for trailing slashes or case mismatches

2. **NextAuth "NEXTAUTH_URL" error**
   - Make sure `NEXTAUTH_URL` is set to your production domain
   - Ensure it starts with `https://` for production

3. **Database connection errors**
   - Verify your NEON database URL is correct
   - Ensure the database schema has been applied
   - Check that your NEON database is not paused

4. **Environment variable not found**
   - Double-check all variables are set in Vercel Dashboard
   - Redeploy after adding new environment variables

## Security Notes

- Never commit real environment variables to your repository
- Use different secrets for development and production
- Regularly rotate your NextAuth secret
- Monitor your Google OAuth usage quotas