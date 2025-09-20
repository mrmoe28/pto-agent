#!/bin/bash

# Deploy with Clerk Production Tests
set -e

echo "🚀 Deploying with Clerk Production Tests..."

# Validate environment first
echo "1. Validating Clerk environment..."
node scripts/validate-clerk-env.js

# Run tests
echo "2. Running Clerk integration tests..."
npx playwright test tests/clerk-integration.spec.ts

# Deploy to production
echo "3. Deploying to production..."
vercel --prod

# Run production tests
echo "4. Running production tests..."
PLAYWRIGHT_BASE_URL=$(vercel ls | head -2 | tail -1 | awk '{print $2}') npx playwright test tests/clerk-integration.spec.ts --grep "Production Environment Tests"

echo "✅ Deployment complete with all tests passing!"
