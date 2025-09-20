#!/bin/bash

# Create .env.local file with Clerk configuration
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
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Database Configuration
DATABASE_URL="postgresql://neondb_owner:npg_CHW9DuN3bvTV@ep-long-wildflower-adf2shp3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Google Custom Search API (for government website search)
GOOGLE_CUSTOM_SEARCH_API_KEY=YOUR_GOOGLE_API_KEY_HERE
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=YOUR_SEARCH_ENGINE_ID_HERE
EOF

echo "Environment file created successfully!"
echo "Please restart your development server for the changes to take effect."