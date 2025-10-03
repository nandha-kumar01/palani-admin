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

// Centralized API error handler
export function handleApiError(error: any, defaultMessage = 'Internal server error') {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: defaultMessage };
}
