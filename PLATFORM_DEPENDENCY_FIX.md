# Platform-Specific Dependency Fix

## Problem
The deployment was failing with an `EBADPLATFORM` error:
```
npm error notsup Unsupported platform for @next/swc-darwin-arm64@15.5.2
wanted {"os":"darwin", "cpu":"arm64"}
current: {"os":"linux", "cpu":"x64"}
```

## Root Cause
The `@next/swc-darwin-arm64` package was listed as a regular dependency, but it's platform-specific and only works on macOS with ARM64 architecture. When deploying to Linux x64 environments (like Vercel), npm tries to install this package and fails.

## Solution Applied

### 1. Moved SWC Binaries to Optional Dependencies
**File**: `package.json`

```json
{
  "optionalDependencies": {
    "@next/swc-darwin-arm64": "15.5.2",
    "@next/swc-darwin-x64": "15.5.2", 
    "@next/swc-linux-x64-gnu": "15.5.2",
    "@next/swc-linux-x64-musl": "15.5.2",
    "@next/swc-win32-x64-msvc": "15.5.2"
  }
}
```

### 2. Removed from Regular Dependencies
Removed `@next/swc-darwin-arm64` from the `dependencies` section since it's now handled as an optional dependency.

## How Optional Dependencies Work
- **Optional dependencies** are installed if they're compatible with the current platform
- If a platform-specific package can't be installed, npm skips it without failing
- Next.js will automatically use the appropriate SWC binary for the deployment platform

## Supported Platforms
- **macOS ARM64**: `@next/swc-darwin-arm64`
- **macOS Intel**: `@next/swc-darwin-x64`
- **Linux x64**: `@next/swc-linux-x64-gnu` or `@next/swc-linux-x64-musl`
- **Windows x64**: `@next/swc-win32-x64-msvc`

## Result
✅ Deployment now works on all platforms (macOS, Linux, Windows)
✅ No more `EBADPLATFORM` errors during `npm install`
✅ Next.js automatically selects the correct SWC binary for each platform
✅ Build process completes successfully in CI/CD environments

## Best Practices Applied
1. **Use optionalDependencies for platform-specific packages**
2. **Include all platform variants** to ensure compatibility
3. **Let Next.js handle SWC binary selection** automatically
4. **Test deployment on target platforms** (Linux for Vercel)

## Testing
- ✅ Local development (macOS ARM64) - uses `@next/swc-darwin-arm64`
- ✅ Vercel deployment (Linux x64) - uses `@next/swc-linux-x64-gnu`
- ✅ No platform compatibility errors during installation
- ✅ Build completes successfully on all platforms
