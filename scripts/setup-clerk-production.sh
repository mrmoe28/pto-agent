#!/bin/bash

# Clerk Production Setup Script
# This script automates the complete setup of Clerk for production

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_header() {
    echo -e "\n${PURPLE}=== $1 ===${NC}\n"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_header "Checking Prerequisites"
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("node")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists vercel; then
        missing_deps+=("vercel")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log_success "All prerequisites are installed"
}

# Check Vercel authentication
check_vercel_auth() {
    log_header "Checking Vercel Authentication"
    
    if ! vercel whoami >/dev/null 2>&1; then
        log_error "Not logged into Vercel"
        echo "Please run: vercel login"
        exit 1
    fi
    
    local user=$(vercel whoami)
    log_success "Logged into Vercel as: $user"
}

# Install Playwright for testing
install_playwright() {
    log_header "Installing Playwright for Testing"
    
    if [ ! -d "node_modules/@playwright" ]; then
        log_info "Installing Playwright..."
        npm install --save-dev @playwright/test
        npx playwright install
        log_success "Playwright installed"
    else
        log_success "Playwright already installed"
    fi
}

# Create test configuration
create_test_config() {
    log_header "Creating Test Configuration"
    
    cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
EOF
    
    log_success "Test configuration created"
}

# Create environment validation script
create_env_validator() {
    log_header "Creating Environment Validator"
    
    cat > scripts/validate-clerk-env.js << 'EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');

function validateClerkEnvironment() {
    console.log('🔍 Validating Clerk Environment Variables...\n');
    
    try {
        // Get environment variables from Vercel
        const output = execSync('vercel env ls', { encoding: 'utf8' });
        
        const requiredVars = [
            'CLERK_SECRET_KEY',
            'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
            'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
            'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL',
            'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL'
        ];
        
        let allPresent = true;
        
        for (const varName of requiredVars) {
            if (output.includes(varName)) {
                console.log(`✅ ${varName} - Present`);
            } else {
                console.log(`❌ ${varName} - Missing`);
                allPresent = false;
            }
        }
        
        if (allPresent) {
            console.log('\n🎉 All required Clerk environment variables are present!');
            
            // Check if using production keys
            const secretKeyMatch = output.match(/CLERK_SECRET_KEY.*sk_(live|test)_/);
            const publishableKeyMatch = output.match(/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.*pk_(live|test)_/);
            
            if (secretKeyMatch && publishableKeyMatch) {
                const secretEnv = secretKeyMatch[1];
                const publishableEnv = publishableKeyMatch[1];
                
                if (secretEnv === 'live' && publishableEnv === 'live') {
                    console.log('🚀 Using PRODUCTION keys - Ready for live users!');
                } else {
                    console.log('⚠️  Using TEST keys - Not suitable for production');
                }
            }
        } else {
            console.log('\n❌ Some required environment variables are missing.');
            console.log('Run: node scripts/update-clerk-production-env.js');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Error validating environment:', error.message);
        process.exit(1);
    }
}

validateClerkEnvironment();
EOF
    
    chmod +x scripts/validate-clerk-env.js
    log_success "Environment validator created"
}

# Create deployment script
create_deployment_script() {
    log_header "Creating Deployment Script"
    
    cat > scripts/deploy-with-tests.sh << 'EOF'
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
EOF
    
    chmod +x scripts/deploy-with-tests.sh
    log_success "Deployment script created"
}

# Create Clerk dashboard checklist
create_dashboard_checklist() {
    log_header "Creating Clerk Dashboard Checklist"
    
    cat > CLERK_PRODUCTION_CHECKLIST.md << 'EOF'
# Clerk Production Setup Checklist

## 🔐 Clerk Dashboard Configuration

### 1. API Keys
- [ ] Go to [Clerk Dashboard](https://clerk.com) → Your App → API Keys
- [ ] Copy **Production** Secret Key (starts with `sk_live_...`)
- [ ] Copy **Production** Publishable Key (starts with `pk_live_...`)

### 2. Domains
- [ ] Go to Domains section
- [ ] Add your production domain: `your-app.vercel.app`
- [ ] Remove any test/development domains if not needed

### 3. Redirect URLs
- [ ] Go to Paths section
- [ ] Set Sign-in URL: `/sign-in`
- [ ] Set Sign-up URL: `/sign-up`
- [ ] Set After Sign-in URL: `/dashboard`
- [ ] Set After Sign-up URL: `/dashboard`

### 4. Authentication Methods
- [ ] Enable Email/Password authentication
- [ ] Configure any additional providers (Google, GitHub, etc.)
- [ ] Set password requirements

### 5. User Management
- [ ] Configure user profile fields
- [ ] Set up user metadata if needed
- [ ] Configure session settings

## 🚀 Deployment Steps

### 1. Update Environment Variables
```bash
node scripts/update-clerk-production-env.js
```

### 2. Validate Configuration
```bash
node scripts/validate-clerk-env.js
```

### 3. Run Tests
```bash
npx playwright test tests/clerk-integration.spec.ts
```

### 4. Deploy
```bash
vercel --prod
```

### 5. Test Production
```bash
npx playwright test tests/clerk-integration.spec.ts --grep "Production Environment Tests"
```

## ✅ Verification

After setup, verify:
- [ ] Users can sign up with production keys
- [ ] Users can sign in with production keys
- [ ] Redirect URLs work correctly
- [ ] User sessions persist properly
- [ ] All authentication flows work in production

## 🆘 Troubleshooting

### Common Issues:
1. **Test keys in production**: Make sure you're using `sk_live_` and `pk_live_` keys
2. **Redirect URL errors**: Check that URLs in Clerk dashboard match your app
3. **Domain issues**: Ensure your production domain is added to Clerk
4. **Environment variables**: Run validation script to check all variables are set

### Getting Help:
- Check Clerk documentation: https://clerk.com/docs
- Run validation script: `node scripts/validate-clerk-env.js`
- Check test results: `npx playwright test --reporter=html`
EOF
    
    log_success "Dashboard checklist created"
}

# Main setup function
main() {
    log_header "Clerk Production Setup Script"
    
    echo "This script will set up everything needed for Clerk production deployment."
    echo "Make sure you have your production keys from the Clerk dashboard ready.\n"
    
    # Run all setup steps
    check_prerequisites
    check_vercel_auth
    install_playwright
    create_test_config
    create_env_validator
    create_deployment_script
    create_dashboard_checklist
    
    log_header "Setup Complete! 🎉"
    
    echo "Next steps:"
    echo "1. 📋 Follow the checklist: CLERK_PRODUCTION_CHECKLIST.md"
    echo "2. 🔑 Get your production keys from Clerk dashboard"
    echo "3. 🔧 Update environment variables: node scripts/update-clerk-production-env.js"
    echo "4. ✅ Validate setup: node scripts/validate-clerk-env.js"
    echo "5. 🚀 Deploy: ./scripts/deploy-with-tests.sh"
    
    echo "\nFor detailed instructions, see: CLERK_PRODUCTION_CHECKLIST.md"
}

# Run main function
main "$@"
