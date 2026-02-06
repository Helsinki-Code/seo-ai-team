/**
 * Exponential Backoff Retry Utility
 * Handles rate limits (429), server overload (503), and transient errors
 * Implements: 2000ms, 4000ms, 8000ms backoff pattern
 */

export const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  baseDelay = 2000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit =
      error.status === 429 ||
      error.code === 429 ||
      error.message?.includes('429') ||
      error.message?.includes('quota') ||
      error.message?.includes('RESOURCE_EXHAUSTED');

    const isServerOverload =
      error.status === 503 ||
      error.code === 503 ||
      error.message?.includes('503');

    const isTransient =
      error.message?.includes('UNAVAILABLE') ||
      error.message?.includes('timeout') ||
      error.message?.includes('DEADLINE_EXCEEDED');

    if (retries > 0 && (isRateLimit || isServerOverload || isTransient)) {
      // Exponential backoff: 2000, 4000, 8000
      const delay = baseDelay * Math.pow(2, 3 - retries);
      console.warn(
        `API Rate Limit/Overload Hit. Retrying in ${delay}ms... (${retries} attempts left)`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, baseDelay);
    }
    throw error;
  }
};
