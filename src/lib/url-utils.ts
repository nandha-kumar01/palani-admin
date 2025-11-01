// Utility function to safely construct base URL for metadata
export function getBaseUrl(): string {
  // Priority order:
  // 1. Explicit NEXT_PUBLIC_SITE_URL (for production)
  // 2. VERCEL_URL (for Vercel deployments)
  // 3. Localhost (for development)
  // 4. Fallback domain

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    // Ensure VERCEL_URL has https:// protocol
    return process.env.VERCEL_URL.startsWith('http') 
      ? process.env.VERCEL_URL 
      : `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Fallback for production
  return 'https://palani-pathayathirai.com';
}

// Validate URL helper
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
