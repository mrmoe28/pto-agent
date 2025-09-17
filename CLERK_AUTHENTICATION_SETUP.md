# Clerk Authentication Setup Documentation

## Overview
This document outlines the complete Clerk authentication setup for the Permit Office Search application, including custom sign-in/sign-up pages and password reset functionality.

## 🔗 Official Documentation References
- **Clerk Next.js Documentation**: https://clerk.com/docs/nextjs/overview
- **Custom Sign-In/Sign-Up Pages**: https://clerk.com/docs/references/nextjs/custom-sign-in-or-up-page
- **Clerk Middleware**: https://clerk.com/docs/nextjs/middleware

## 🚀 Implementation Summary

### 1. Environment Configuration
The application uses the following environment variables in `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cm9tYW50aWMtamVubmV0LTQ5LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_wbXnNxJWGeEMgK5aFvfsg77ua8ZmC87IftZe8eL3tw
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
CLERK_FRONTEND_API_URL=https://romantic-jennet-49.clerk.accounts.dev
CLERK_BACKEND_API_URL=https://api.clerk.com
CLERK_JWKS_URL=https://romantic-jennet-49.clerk.accounts.dev/.well-known/jwks.json
```

### 2. Middleware Configuration (`middleware.ts`)
```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

### 3. Root Layout with ClerkProvider (`src/app/layout.tsx`)
```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 4. Authentication Flow
- **Root page (`/`)** → Redirects unauthenticated users to `/sign-in`
- **Sign-in page (`/sign-in`)** → Custom styled Clerk SignIn component
- **Sign-up page (`/sign-up`)** → Custom styled Clerk SignUp component  
- **Forgot password (`/forgot-password`)** → Custom password reset implementation
- **After authentication** → Redirects to `/dashboard`

## 🎨 Custom UI Implementation

### Sign-In Page Features
- **Modern gradient background** (blue to indigo)
- **Professional branding** with "Permit Office Search" title
- **Custom Clerk component styling** with Tailwind CSS
- **Navigation links** to sign-up and forgot password
- **Responsive design** for all screen sizes

### Sign-Up Page Features
- **Consistent design** with sign-in page
- **Custom Clerk SignUp component** styling
- **Cross-navigation** to sign-in and forgot password

### Forgot Password Page Features
- **Custom implementation** using Clerk's `useSignIn` hook
- **Email-based password reset** functionality
- **Loading states** and error handling
- **Success/error messaging** with proper styling

## 🔧 Key Technical Decisions

### 1. Custom Password Reset Implementation
Instead of using Clerk's built-in ForgotPassword component (which doesn't exist), we implemented a custom solution using:
- `useSignIn` hook from `@clerk/nextjs`
- `reset_password_email_code` strategy
- Custom UI with loading states and error handling

### 2. Middleware Simplification
Following Clerk's latest documentation, we simplified the middleware to use the basic `clerkMiddleware()` approach rather than complex route matching, which resolved authentication issues.

### 3. Environment Variable Priority
The `.env.local` file takes precedence over `.env` in Next.js, so we ensured the correct keys were set in `.env.local` to override any placeholder values.

## 🚨 Troubleshooting

### Common Issues and Solutions

1. **"Publishable key not valid" Error**
   - **Cause**: Incorrect or missing Clerk API keys
   - **Solution**: Verify keys in `.env.local` file and ensure they match your Clerk dashboard

2. **Environment Variable Conflicts**
   - **Cause**: `.env.local` overriding `.env` with invalid keys
   - **Solution**: Update `.env.local` with correct keys instead of `.env`

3. **Middleware Authentication Issues**
   - **Cause**: Complex route matching in middleware
   - **Solution**: Use simplified `clerkMiddleware()` approach as per latest documentation

## 📁 File Structure
```
src/
├── app/
│   ├── layout.tsx                 # Root layout with ClerkProvider
│   ├── page.tsx                   # Root page with auth redirect
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx          # Custom sign-in page
│   ├── sign-up/
│   │   └── [[...sign-up]]/
│   │       └── page.tsx          # Custom sign-up page
│   └── forgot-password/
│       └── [[...forgot-password]]/
│           └── page.tsx          # Custom forgot password page
└── middleware.ts                  # Clerk middleware configuration
```

## ✅ Testing Checklist

- [x] Root page redirects unauthenticated users to sign-in
- [x] Sign-in page loads and displays correctly
- [x] Sign-up page loads and displays correctly
- [x] Forgot password page loads and functions correctly
- [x] Authentication flow works end-to-end
- [x] Custom styling applied consistently
- [x] Responsive design works on all screen sizes
- [x] No build errors or linting issues

## 🎯 Next Steps

1. **Test authentication flows** in production environment
2. **Customize Clerk appearance** further if needed
3. **Add additional auth features** (social login, MFA, etc.)
4. **Implement user profile management** in dashboard
5. **Add logout functionality** to dashboard

---

**Last Updated**: September 16, 2025  
**Status**: ✅ Complete and Functional
