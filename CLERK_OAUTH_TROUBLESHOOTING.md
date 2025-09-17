# Clerk OAuth Callback Error Troubleshooting

## Error: "invalid handshake" - unable to create session token

This error occurs when there's a mismatch between your OAuth configuration and the callback URL.

## Common Causes & Solutions

### 1. Incorrect Redirect URLs

**Problem**: OAuth provider redirect URLs don't match your app's domain.

**Solution**:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **OAuth** settings
3. Check **Redirect URLs** section
4. Ensure URLs match your actual domain:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

### 2. OAuth Provider Configuration Mismatch

**Problem**: OAuth provider (Google, GitHub, etc.) has incorrect callback URLs.

**Solution**:
1. **Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Edit your OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `https://your-clerk-instance.clerk.accounts.dev/v1/oauth_callback`
     - `https://your-clerk-instance.clerk.accounts.dev/v1/oauth_callback/google`

2. **GitHub OAuth**:
   - Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
   - Edit your OAuth App
   - Update **Authorization callback URL**:
     - `https://your-clerk-instance.clerk.accounts.dev/v1/oauth_callback`

3. **Microsoft OAuth**:
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to **App registrations** → Your app
   - Go to **Authentication**
   - Add redirect URIs:
     - `https://your-clerk-instance.clerk.accounts.dev/v1/oauth_callback`

### 3. Environment Variables Mismatch

**Problem**: Using development keys in production or vice versa.

**Solution**:
1. Check your environment variables:
   ```bash
   # Development
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Production
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   ```

2. Ensure you're using the correct keys for your environment.

### 4. Domain Configuration Issues

**Problem**: Clerk instance domain doesn't match your app domain.

**Solution**:
1. Go to Clerk Dashboard → **Domains**
2. Ensure your domain is properly configured
3. Check that DNS records are set up correctly
4. Wait for DNS propagation (up to 48 hours)

### 5. OAuth Provider API Keys

**Problem**: OAuth provider API keys are incorrect or expired.

**Solution**:
1. Verify API keys in Clerk Dashboard → **OAuth**
2. Check that OAuth provider credentials are valid
3. Regenerate keys if necessary
4. Update both Clerk Dashboard and OAuth provider

## Step-by-Step Fix

### 1. Check Clerk Dashboard Configuration
```bash
# Go to Clerk Dashboard → OAuth
# Verify these settings:
- Redirect URLs: https://your-clerk-instance.clerk.accounts.dev/v1/oauth_callback
- OAuth providers are enabled
- API keys are correct
```

### 2. Check OAuth Provider Configuration
```bash
# For each OAuth provider:
- Authorized redirect URIs include Clerk callback URL
- API keys match those in Clerk Dashboard
- OAuth app is active/enabled
```

### 3. Verify Environment Variables
```bash
# Check your .env.local or production environment:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # or pk_live_...
CLERK_SECRET_KEY=sk_test_... # or sk_live_...
```

### 4. Test OAuth Flow
```bash
# 1. Clear browser cache and cookies
# 2. Try OAuth sign-in again
# 3. Check browser console for errors
# 4. Check Clerk Dashboard for error logs
```

## Debugging Steps

### 1. Check Browser Console
Look for JavaScript errors that might indicate configuration issues.

### 2. Check Network Tab
- Look for failed requests to OAuth providers
- Check if redirect URLs are correct
- Verify API keys are being sent

### 3. Check Clerk Dashboard Logs
- Go to Clerk Dashboard → **Logs**
- Look for OAuth-related errors
- Check the `clerk_trace_id` from the error

### 4. Test with Different OAuth Provider
Try a different OAuth provider to isolate the issue.

## Common OAuth Provider URLs

### Google OAuth
- **Authorized redirect URIs**:
  - `https://your-clerk-instance.clerk.accounts.dev/v1/oauth_callback`
  - `https://your-clerk-instance.clerk.accounts.dev/v1/oauth_callback/google`

### GitHub OAuth
- **Authorization callback URL**:
  - `https://your-clerk-instance.clerk.accounts.dev/v1/oauth_callback`

### Microsoft OAuth
- **Redirect URIs**:
  - `https://your-clerk-instance.clerk.accounts.dev/v1/oauth_callback`

## Still Having Issues?

1. **Check Clerk Status**: Visit [Clerk Status Page](https://status.clerk.com/)
2. **Contact Support**: Use the `clerk_trace_id` from the error
3. **Review Documentation**: [Clerk OAuth Documentation](https://clerk.com/docs/authentication/social-connections)
4. **Check GitHub Issues**: [Clerk GitHub Issues](https://github.com/clerkinc/javascript/issues)

## Prevention

1. **Always test OAuth in development first**
2. **Use environment variables for different environments**
3. **Keep OAuth provider and Clerk configurations in sync**
4. **Document your OAuth configuration**
5. **Test OAuth after any configuration changes**
