#!/bin/bash

# Fix Clerk Environment Variables Script
# This script removes and re-adds the broken Clerk environment variables

echo "🔧 Fixing Clerk Environment Variables..."

# Remove broken variables
echo "Removing broken variables..."

vercel env rm NEXT_PUBLIC_CLERK_SIGN_IN_URL --yes --environment production
vercel env rm NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL --yes --environment production  
vercel env rm NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL --yes --environment production

echo "Adding correct variables..."

# Add correct variables without newlines
echo "/sign-in" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL --environment production
echo "/" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL --environment production
echo "/" | vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL --environment production

echo "✅ Environment variables fixed!"
echo "🔄 Redeploying application..."

vercel --prod

echo "🎉 Fix complete! Test your sign-in now."