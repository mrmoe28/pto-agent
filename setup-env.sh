#!/bin/bash

# Setup script to create .env.local file for Clerk authentication
# This script will create the missing environment file that's causing the 502 error

echo "🔧 Setting up Clerk authentication environment variables..."

# Create .env.local file
cat > .env.local << 'EOF'
# Clerk Authentication Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cm9tYW50aWMtamVubmV0LTQ5LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_wbXnNxJWGeEMgK5aFvfsg77ua8ZmC87IftZe8eL3tw
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
CLERK_FRONTEND_API_URL=https://romantic-jennet-49.clerk.accounts.dev
CLERK_BACKEND_API_URL=https://api.clerk.com
CLERK_JWKS_URL=https://romantic-jennet-49.clerk.accounts.dev/.well-known/jwks.json

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Configuration (Update with your actual Neon database URL)
# DATABASE_URL=postgresql://username:password@hostname:port/database

# Google APIs (Optional - for geocoding functionality)
# GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
# LOCATIONIQ_ACCESS_TOKEN=your_locationiq_token_here
EOF

echo "✅ Created .env.local file with Clerk configuration"
echo ""
echo "🚀 Next steps:"
echo "1. Update DATABASE_URL with your actual Neon database URL"
echo "2. Add Google API keys if you want geocoding functionality"
echo "3. Restart your development server: npm run dev"
echo ""
echo "🔍 The 502 error should now be resolved!"
echo ""
echo "📋 To test:"
echo "- Navigate to http://localhost:3000"
echo "- Should redirect to /sign-in page"
echo "- Test authentication flow"
