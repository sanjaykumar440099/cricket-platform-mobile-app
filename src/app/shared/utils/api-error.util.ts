export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const response = error as {
    status?: number;
    error?: {
      message?: string | string[];
      error?: string;
    };
    message?: string;
  };

  const message = response?.error?.message;

  if (Array.isArray(message) && message.length) {
    return message.join(' ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (response?.status === 403) {
    return 'This account does not have permission for that action. Sign in as an admin or scorer.';
  }

  if (response?.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  return response?.error?.error || response?.message || fallback;
}
