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
