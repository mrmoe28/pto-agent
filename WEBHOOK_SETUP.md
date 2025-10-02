# Clerk Webhook Setup for Production

## Overview
This application uses Clerk webhooks to automatically manage user lifecycle events in the database. When users sign up, update their profile, or delete their account, the webhook automatically syncs these changes to your NeonDB database.

## Webhook Events Handled

### 1. `user.created` - New User Registration
**What happens automatically:**
- ✅ Creates user profile in `user_profiles` table
- ✅ Creates free subscription in `user_subscriptions` table
- ✅ Sets default preferences (notifications: true, theme: light, emailUpdates: true)
- ✅ Assigns 1 free search to new user
- ✅ Sets 1-month subscription period

**Database Records Created:**
```json
// user_profiles
{
  "userId": "user_clerkId123",
  "firstName": "John",
  "lastName": "Doe",
  "preferences": {
    "notifications": true,
    "theme": "light",
    "emailUpdates": true
  }
}

// user_subscriptions
{
  "userId": "user_clerkId123",
  "plan": "free",
  "status": "active",
  "searchesUsed": 0,
  "searchesLimit": 1,
  "currentPeriodEnd": "2025-11-01T00:00:00Z"
}
```

### 2. `user.updated` - User Profile Changes
**What happens automatically:**
- ✅ Updates firstName/lastName if changed in Clerk
- ✅ Updates subscription plan if `public_metadata.subscriptionPlan` changes
- ✅ Adjusts search limits based on plan (free: 1, pro: 40, enterprise: unlimited)

### 3. `user.deleted` - User Account Deletion (GDPR Compliance)
**What happens automatically:**
- ✅ Deletes all user favorites from `user_favorites`
- ✅ Deletes all search history from `user_permit_searches`
- ✅ Deletes subscription from `user_subscriptions`
- ✅ Deletes user profile from `user_profiles`

## Setting Up Webhooks in Clerk Dashboard

### Step 1: Get Your Webhook Endpoint URL
Your webhook endpoint: `https://your-domain.vercel.app/api/webhooks/clerk`

For development: `http://localhost:3000/api/webhooks/clerk`

### Step 2: Configure Webhook in Clerk Dashboard

1. **Go to Clerk Dashboard** → Select your application
2. **Navigate to Webhooks** (in the left sidebar under "Configure")
3. **Click "Add Endpoint"**
4. **Enter your webhook URL:**
   - Production: `https://pto-agent-main.vercel.app/api/webhooks/clerk`
   - Development: Use ngrok or similar for local testing

5. **Subscribe to these events:**
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`

6. **Copy the Signing Secret** (looks like: `whsec_xxxxxxxxxxxxx`)

### Step 3: Add Webhook Secret to Environment Variables

#### Vercel (Production):
1. Go to your Vercel project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `CLERK_WEBHOOK_SECRET`
   - **Value:** `whsec_xxxxxxxxxxxxx` (your signing secret)
   - **Environment:** Production, Preview, Development

#### Local Development:
Add to your `.env.local` file:
```bash
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 4: Test the Webhook

#### Option 1: Using Clerk Dashboard
1. Go to Webhooks → Your webhook endpoint
2. Click "Send test event"
3. Select `user.created` event
4. Click "Send test event"
5. Check webhook logs to verify success

#### Option 2: Create a Test User
1. Sign up with a new test account
2. Check your application logs for:
   ```
   ✅ User profile created: { userId: 'user_xxx', firstName: 'Test', lastName: 'User' }
   ✅ Free subscription created: { userId: 'user_xxx', plan: 'free', limit: 1 }
   ```

### Step 5: Verify Database Records

Connect to your NeonDB database and verify:

```sql
-- Check if user profile was created
SELECT * FROM user_profiles WHERE user_id = 'user_clerkId123';

-- Check if subscription was created
SELECT * FROM user_subscriptions WHERE user_id = 'user_clerkId123';
```

## Troubleshooting

### Webhook Returns 400 Error
**Issue:** Missing or invalid Svix headers
**Solution:** 
- Verify `CLERK_WEBHOOK_SECRET` is set correctly
- Ensure webhook URL is correct in Clerk dashboard
- Check that webhook secret matches between Clerk and your environment variables

### User Profile Not Created
**Issue:** Database connection error or missing tables
**Solution:**
- Run database migrations: `npm run migrate:db`
- Check NeonDB connection string in environment variables
- Verify database schema exists

### Webhook Logs Show Errors
**Issue:** Database insertion errors
**Solution:**
- Check server logs for specific error messages
- Verify database schema matches code expectations
- Ensure unique constraints aren't being violated

### Testing Locally
For local development, use **ngrok** or **Clerk's dev environment**:

1. Install ngrok: `npm install -g ngrok`
2. Start your dev server: `npm run dev`
3. Start ngrok: `ngrok http 3000`
4. Copy the ngrok URL (https://xxx.ngrok.io)
5. Add webhook in Clerk: `https://xxx.ngrok.io/api/webhooks/clerk`

## Monitoring Webhooks

### Check Webhook Delivery Status
1. Go to Clerk Dashboard → Webhooks
2. Click on your webhook endpoint
3. View "Recent deliveries" to see success/failure status
4. Click individual deliveries to see request/response details

### View Server Logs
- **Vercel:** Project → Deployments → Click deployment → Functions tab → View logs
- **Local:** Check terminal output for console.log messages

### Log Format
```
✅ User profile created: { userId: 'user_xxx', firstName: 'John', lastName: 'Doe' }
✅ Free subscription created: { userId: 'user_xxx', plan: 'free', limit: 1 }
✅ User profile updated: { userId: 'user_xxx', firstName: 'Jane', lastName: 'Smith' }
✅ User subscription updated: { userId: 'user_xxx', plan: 'pro', searchesLimit: 40 }
✅ User data deleted: { userId: 'user_xxx' }
❌ Error creating user profile/subscription: [error details]
```

## Security Best Practices

1. **Never commit webhook secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Verify webhook signatures** (already implemented via Svix)
4. **Monitor webhook failures** regularly
5. **Implement retry logic** for transient database errors (optional enhancement)

## Upgrading User Plans

To upgrade a user from free to pro/enterprise:

1. **Update Clerk user metadata:**
   ```javascript
   await clerkClient.users.updateUserMetadata(userId, {
     publicMetadata: {
       subscriptionPlan: 'pro' // or 'enterprise'
     }
   });
   ```

2. **Webhook automatically:**
   - Updates `user_subscriptions.plan` to 'pro'
   - Updates `user_subscriptions.searchesLimit` to 40 (or null for enterprise)
   - Logs the change

## Support

If webhooks are not working:
1. Check Clerk Dashboard → Webhooks → Recent deliveries
2. Check Vercel logs for errors
3. Verify all environment variables are set
4. Test with a simple curl request to verify endpoint is accessible

---

**Last Updated:** October 2025
**Status:** ✅ Production Ready
