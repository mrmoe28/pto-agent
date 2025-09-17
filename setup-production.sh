#!/bin/bash

# 🚀 Clerk Production Setup Script
# This script helps you set up your Clerk application for production

echo "🚀 Clerk Production Setup Script"
echo "================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please make sure you're in the project root directory."
    exit 1
fi

echo "✅ Found .env.local file"
echo ""

# Create production environment template
echo "📝 Creating production environment template..."
cat > .env.production.template << 'EOF'
# Production Environment Variables
# Replace these values with your production keys from Clerk Dashboard

# Clerk Authentication (PRODUCTION KEYS)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY

# Clerk URLs (Update with your production domain)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=https://yourdomain.com
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=https://yourdomain.com
CLERK_WEBHOOK_SECRET=YOUR_PRODUCTION_WEBHOOK_SECRET

# Clerk API URLs (Update with your production instance)
CLERK_FRONTEND_API_URL=https://your-production-instance.clerk.accounts.dev
CLERK_BACKEND_API_URL=https://api.clerk.com
CLERK_JWKS_URL=https://your-production-instance.clerk.accounts.dev/.well-known/jwks.json

# Google OAuth (Production Credentials)
GOOGLE_CLIENT_ID=YOUR_PRODUCTION_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_PRODUCTION_GOOGLE_CLIENT_SECRET

# NextAuth Configuration (Production)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=YOUR_PRODUCTION_NEXTAUTH_SECRET

# Database (Production)
DATABASE_URL=YOUR_PRODUCTION_DATABASE_URL

# API Keys (Production)
OPENAI_API_KEY=YOUR_PRODUCTION_OPENAI_KEY
GOOGLE_MAPS_API_KEY=YOUR_PRODUCTION_GOOGLE_MAPS_KEY
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=YOUR_PRODUCTION_GOOGLE_PLACES_KEY
LOCATIONIQ_ACCESS_TOKEN=YOUR_PRODUCTION_LOCATIONIQ_TOKEN
EOF

echo "✅ Created .env.production.template"
echo ""

# Show current development keys
echo "🔍 Current Development Keys:"
echo "============================"
grep "CLERK.*KEY" .env.local | head -2
echo ""

# Show what needs to be changed
echo "⚠️  IMPORTANT: You need to replace these development keys with production keys:"
echo "   - Development keys start with 'pk_test_' and 'sk_test_'"
echo "   - Production keys start with 'pk_live_' and 'sk_live_'"
echo ""

echo "📋 Next Steps:"
echo "=============="
echo "1. Go to https://dashboard.clerk.com"
echo "2. Create a production instance"
echo "3. Get your production API keys"
echo "4. Update .env.production.template with your production values"
echo "5. Rename .env.production.template to .env.production"
echo "6. Deploy your application with production environment variables"
echo ""

echo "📚 For detailed instructions, see PRODUCTION_SETUP.md"
echo ""

# Check if user wants to open Clerk dashboard
read -p "🌐 Would you like to open the Clerk Dashboard? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Opening Clerk Dashboard..."
    open "https://dashboard.clerk.com"
fi

echo ""
echo "✅ Setup script completed!"
echo "Remember to never commit production keys to version control!"
