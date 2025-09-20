# Playwright Build Fix

## Problem
Build fails with error: "Cannot find module '@playwright/test' or its corresponding type declarations" in `playwright.config.ts`

## Root Cause
The `playwright.config.ts` file was being included in the TypeScript compilation during the main application build process. Since Playwright is a dev dependency used only for testing, it should be excluded from the production build.

## Solution
Updated `tsconfig.json` to exclude Playwright-related files from the build process:

```json
{
  "exclude": ["node_modules", "playwright.config.ts", "tests/**/*"]
}
```

## Files Modified
- `tsconfig.json` - Added exclusions for Playwright config and test files

## Verification
- Build now completes successfully with `npm run build`
- Playwright tests can still be run independently with `npm run test:clerk`

## Prevention
When adding testing frameworks or dev-only tools:
1. Ensure their config files are excluded from the main TypeScript compilation
2. Add appropriate exclusions to `tsconfig.json`
3. Test both the build process and the testing framework separately
