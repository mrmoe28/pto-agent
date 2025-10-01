#!/bin/bash

# Script to fix environment variables with embedded newlines in Vercel production
# These newlines break the Clerk configuration and prevent sign-in from working

set -e

echo "🔧 Fixing Vercel Environment Variables with Embedded Newlines"
echo "=============================================================="
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

echo -e "${YELLOW}⚠️  WARNING: This script will update production environment variables${NC}"
echo ""
echo "Variables that will be fixed:"
echo "  - NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL"
echo "  - NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL"
echo "  - GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET"
echo "  - GOOGLE_CUSTOM_SEARCH_API_KEY"
echo "  - GOOGLE_CUSTOM_SEARCH_ENGINE_ID"
echo "  - NEXTAUTH_SECRET"
echo "  - NEXTAUTH_URL"
echo "  - NEXT_PUBLIC_GOOGLE_PLACES_API_KEY"
echo "  - OPENAI_API_KEY"
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

echo ""
echo -e "${YELLOW}🔄 Updating environment variables...${NC}"
echo ""

# Function to update env var
update_env() {
    local var_name=$1
    local var_value=$2

    echo "Updating ${var_name}..."
    vercel env rm "${var_name}" production -y 2>/dev/null || echo "  Variable doesn't exist, adding..."
    echo "${var_value}" | vercel env add "${var_name}" production
}

# Fix Clerk redirect URLs
update_env "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL" "/dashboard"
update_env "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL" "/dashboard"

# Fix Google Client credentials (remove newlines)
update_env "GOOGLE_CLIENT_ID" "7731146016-miecdisdk28ef007thqu03mj988gv6d7.apps.googleusercontent.com"
update_env "GOOGLE_CLIENT_SECRET" "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"

# Fix Google API keys
update_env "GOOGLE_CUSTOM_SEARCH_API_KEY" "AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo"
update_env "GOOGLE_CUSTOM_SEARCH_ENGINE_ID" "a0bfe8729f6a445d0"
update_env "NEXT_PUBLIC_GOOGLE_PLACES_API_KEY" "AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo"

# Fix NextAuth
update_env "NEXTAUTH_SECRET" "E+DBfEaOB942NRXa+r1KQ2zzhgQ/R+959AoN6/7CHKc="
update_env "NEXTAUTH_URL" "https://www.ptoagent.app"

# Fix OpenAI API key (get value from your .env file)
# update_env "OPENAI_API_KEY" "your_openai_api_key_here"

echo ""
echo -e "${GREEN}✅ Environment variables updated successfully!${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Clerk Keys Issue Detected${NC}"
echo ""
echo "The current production Clerk keys reference 'clerk.ptoagent.com' which doesn't exist."
echo "This is why the Clerk sign-in component isn't loading on production."
echo ""
echo "You need to:"
echo "1. Go to https://dashboard.clerk.com"
echo "2. Navigate to your production instance (or create one for ptoagent.app)"
echo "3. Get the correct production keys for ptoagent.app domain"
echo "4. Update these variables manually:"
echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "   - CLERK_SECRET_KEY"
echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo "1. Update Clerk production keys in Vercel dashboard"
echo "2. Redeploy your application:"
echo "   ${GREEN}vercel --prod${NC}"
echo ""
echo "Or trigger GitHub Actions deployment:"
echo "   ${GREEN}git commit --allow-empty -m 'fix: update environment variables' && git push${NC}"
echo ""
echo -e "${GREEN}✅ Done!${NC}"
