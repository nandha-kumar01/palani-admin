// Utility to add timeout to async operations
export async function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = 'Operation timed out'): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

// Centralized API error handler with better error classification
export function handleApiError(error: any, defaultMessage = 'Internal server error') {
  if (error instanceof Error) {
    // Classify different types of errors
    if (error.message.includes('timeout')) {
      return { success: false, error: 'Request timed out', code: 'TIMEOUT' };
    }
    if (error.message.includes('connection')) {
      return { success: false, error: 'Database connection error', code: 'CONNECTION_ERROR' };
    }
    if (error.message.includes('validation')) {
      return { success: false, error: 'Validation error', code: 'VALIDATION_ERROR' };
    }
    return { success: false, error: error.message };
  }
  return { success: false, error: defaultMessage };
}

// Add retry mechanism for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) break;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
}

// Enhanced API fetch utility
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  retries: number = 2
): Promise<{ success: boolean; data?: T; error?: string; status: number }> {
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        return { success: true, data, status: response.status };
      }

      // Handle specific error cases
      if (response.status === 401) {
        return { success: false, error: 'Authentication failed', status: 401 };
      }

      if (response.status === 403) {
        return { success: false, error: 'Access denied', status: 403 };
      }

      return { 
        success: false, 
        error: data.error || `Request failed (${response.status})`, 
        status: response.status 
      };

    } catch (error: any) {
      console.warn(`API request attempt ${attempt + 1} failed:`, error);

      if (attempt === retries) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request timed out', status: 408 };
        }
        return { success: false, error: 'Network error', status: 0 };
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return { success: false, error: 'Max retries exceeded', status: 0 };
}
