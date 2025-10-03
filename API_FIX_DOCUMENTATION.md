# API Routes Fix Documentation

## Problem
The application was configured with `output: 'export'` in `next.config.ts`, which generates static HTML files. This configuration is incompatible with API routes because:

1. API routes require a server to execute server-side code
2. Static export generates only static HTML/CSS/JS files
3. When API routes were called, Next.js returned HTML error pages instead of JSON responses

## Solution

### 1. Modified `next.config.ts`
- Changed from always using `output: 'export'` to conditional static export
- Now only uses static export when `MOBILE_BUILD=true` environment variable is set
- This allows normal development with working API routes, while still supporting mobile builds

### 2. Updated Package.json Scripts
- Modified `build:mobile` script to set `MOBILE_BUILD=true` environment variable
- This ensures mobile builds use static export for Capacitor compatibility

### 3. Removed Dynamic Export Configurations
- Removed `export const dynamic = 'force-dynamic'` and `export const revalidate = false` from all API routes
- These were added to fix static export issues but are not needed with the new configuration

## Usage

### Development
```bash
npm run dev
```
- Runs with normal Next.js configuration
- API routes work properly with server-side functionality

### Mobile Build
```bash
npm run build:mobile
```
- Sets `MOBILE_BUILD=true`
- Uses static export for Capacitor compatibility
- Generates static files for mobile app

### Web Production Build
```bash
npm run build
```
- Normal Next.js build without static export
- API routes work in production environment

## Files Modified
- `next.config.ts` - Added conditional static export
- `package.json` - Updated mobile build script
- All API route files - Removed dynamic export configurations
- `src/app/api/test/route.ts` - Added test endpoint

## Testing
The development server should now start without errors and API routes should return proper JSON responses instead of HTML error pages.
