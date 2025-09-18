# Vercel Project Cleanup Plan

## 🔍 Current Situation

We have **TWO duplicate PTO agent projects** in Vercel:

### Project 1: `pto-agent-main` (Currently Active)
- **Project ID**: `prj_ZfjJuQR6EJ0dHYVUA5J7MfYe0Njt`
- **Production URL**: https://pto-agent-main-ekoapps.vercel.app
- **Status**: Currently linked to this directory
- **Environment Variables**: ✅ Complete (as verified earlier)

### Project 2: `pto-agent` (Duplicate)
- **Project ID**: `prj_s8ArE9xMQcd588NLMBSnY2WeX9fB`
- **Production URL**: https://pto-agent-ekoapps.vercel.app
- **Status**: Duplicate project
- **Environment Variables**: ❓ Unknown (likely incomplete)

## 🎯 Which Project Are We Using?

**We are currently using `pto-agent-main`** in this session because:
1. This directory is linked to `pto-agent-main`
2. All our recent deployments have been to `pto-agent-main`
3. The environment variables are properly configured for `pto-agent-main`
4. Our recent middleware fixes were deployed to `pto-agent-main`

## 🚨 The Problem

The duplicate `pto-agent` project is likely:
1. **Missing environment variables** needed for proper functionality
2. **Using outdated code** without our recent fixes
3. **Causing confusion** about which URL to use
4. **Potentially interfering** with the correct project

## 🧹 Cleanup Actions Required

### Step 1: Verify Current Project Status
```bash
# Check which project we're linked to
vercel project

# Check environment variables for current project
vercel env ls
```

### Step 2: Compare Environment Variables
We need to check if `pto-agent` has the same environment variables as `pto-agent-main`.

### Step 3: Delete Duplicate Project
Once we confirm `pto-agent-main` is working correctly, we should delete the duplicate `pto-agent` project.

### Step 4: Update Documentation
Update all references to use the correct project URL.

## 🔧 Immediate Actions

### 1. Test Current Project
Let's verify that `pto-agent-main` is working correctly with our recent fixes.

### 2. Check Duplicate Project
We need to see what's in the `pto-agent` project and why it exists.

### 3. Clean Up
Remove the duplicate project to avoid confusion.

## 📋 Environment Variables Checklist

The working project (`pto-agent-main`) should have:

**Required Variables:**
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- ✅ `CLERK_SECRET_KEY`
- ✅ `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
- ✅ `GOOGLE_MAPS_API_KEY`
- ✅ `DATABASE_URL`
- ✅ `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- ✅ `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`

**Optional Variables:**
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `NEXTAUTH_URL`
- ✅ `NEXTAUTH_SECRET`

## 🎯 Next Steps

1. **Verify** that `pto-agent-main` is working correctly
2. **Test** the search functionality on the production URL
3. **Compare** environment variables between projects
4. **Delete** the duplicate `pto-agent` project
5. **Update** all documentation to reference the correct project

## 🔗 Correct URLs to Use

**Production URL**: https://pto-agent-main-ekoapps.vercel.app
**GitHub Repository**: https://github.com/mrmoe28/pto-agent.git
**Vercel Dashboard**: https://vercel.com/ekoapps/pto-agent-main

---

*Created: 2025-09-18*
*Status: Ready for cleanup*
