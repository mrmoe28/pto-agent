#!/bin/bash

# Script to add environment variables to Vercel
# Run this script with: bash setup-vercel-env.sh

echo "Setting up Vercel environment variables for pto-agent project..."
echo "Make sure you're logged into Vercel CLI (vercel login)"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

echo "Adding environment variables to Vercel..."

# Clerk Authentication Variables
echo "Adding Clerk authentication variables..."
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production < /dev/null
vercel env add CLERK_SECRET_KEY production < /dev/null
vercel env add CLERK_WEBHOOK_SECRET production < /dev/null

# Clerk URLs (these are the same for all environments)
echo "NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production
echo "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL production
echo "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/" | vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL production

# Clerk API URLs
echo "https://romantic-jennet-49.clerk.accounts.dev" | vercel env add CLERK_FRONTEND_API_URL production
echo "https://api.clerk.com" | vercel env add CLERK_BACKEND_API_URL production
echo "https://romantic-jennet-49.clerk.accounts.dev/.well-known/jwks.json" | vercel env add CLERK_JWKS_URL production

# Database URL
echo "Adding database URL..."
vercel env add DATABASE_URL production < /dev/null

# OpenAI API Key (if needed)
echo "Adding OpenAI API key..."
vercel env add OPENAI_API_KEY production < /dev/null

# Google APIs
echo "Adding Google Places API key..."
vercel env add GOOGLE_PLACES_API_KEY production < /dev/null
echo "Adding Google Maps API key..."
vercel env add GOOGLE_MAPS_API_KEY production < /dev/null

# Google OAuth (if still needed alongside Clerk)
echo "Adding Google OAuth credentials..."
vercel env add GOOGLE_CLIENT_ID production < /dev/null
vercel env add GOOGLE_CLIENT_SECRET production < /dev/null

# NextAuth (might not be needed if using Clerk)
echo "Adding NextAuth configuration..."
vercel env add NEXTAUTH_SECRET production < /dev/null
echo "https://pto-agent.vercel.app" | vercel env add NEXTAUTH_URL production

echo ""
echo "✅ Script complete!"
echo ""
echo "IMPORTANT: You'll need to manually enter the secret values when prompted."
echo "You can find these values in your .env.local file or Clerk dashboard."
echo ""
echo "To verify, run: vercel env ls"
echo "To trigger a new deployment: vercel --prod"