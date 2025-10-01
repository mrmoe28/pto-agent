#!/bin/bash

# Script to fix Clerk redirect URLs in Vercel production environment
# This updates the redirect URLs to point to /dashboard instead of /

set -e

echo "🔧 Fixing Clerk Redirect URLs in Vercel Production"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Please install it first:${NC}"
    echo "   npm install -g vercel"
    exit 1
fi

echo -e "${YELLOW}📋 Current Clerk redirect environment variables:${NC}"
vercel env ls production | grep CLERK_.*REDIRECT

echo ""
echo -e "${YELLOW}🔄 Updating environment variables...${NC}"
echo ""

# Remove old incorrect values
echo "Removing old NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL..."
vercel env rm NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL production -y 2>/dev/null || echo "Variable doesn't exist, skipping..."

echo "Removing old NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL..."
vercel env rm NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL production -y 2>/dev/null || echo "Variable doesn't exist, skipping..."

echo ""
echo -e "${GREEN}➕ Adding correct redirect URLs...${NC}"
echo ""

# Add correct values
echo "/dashboard" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL production

echo "/dashboard" | vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL production

echo ""
echo -e "${GREEN}✅ Environment variables updated successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 New Clerk redirect environment variables:${NC}"
vercel env ls production | grep CLERK_.*REDIRECT

echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo "1. Redeploy your application to apply changes:"
echo "   ${GREEN}vercel --prod${NC}"
echo ""
echo "2. Or trigger GitHub Actions deployment:"
echo "   ${GREEN}git commit --allow-empty -m 'chore: trigger redeploy' && git push${NC}"
echo ""
echo -e "${GREEN}✅ Done!${NC}"
