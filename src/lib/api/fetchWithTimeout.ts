/**
 * Fetch with timeout and optional retry logic for handling transient errors
 * like connection resets and backend cold starts.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number; maxRetries?: number } = {},
) {
  const { timeout = 5000, maxRetries = 3, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return res;
    } catch (error) {
      lastError = error as Error;
      const isLastAttempt = attempt === maxRetries - 1;

      // Determine if we should retry
      const shouldRetry =
        !isLastAttempt &&
        (error instanceof Error &&
          (error.name === "AbortError" || // timeout
            error.message.includes("ECONNRESET") || // connection reset
            error.message.includes("ECONNREFUSED") || // connection refused (cold start)
            error.message.includes("ERR_FAILED"))); // generic network failure

      if (!shouldRetry) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
