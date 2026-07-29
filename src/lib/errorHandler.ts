export type ErrorType = 'network' | 'validation' | 'unauthorized' | 'not_found' | 'server' | 'unknown';

export interface APIError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

export function parseAPIError(error: unknown): APIError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Network error: Unable to connect to the server. Please check your internet connection.',
      details: { originalError: error.message },
    };
  }

  if (error instanceof Error) {
    const message = error.message;

    if (message.includes('400')) {
      return {
        type: 'validation',
        message: 'Invalid input. Please check your form and try again.',
        statusCode: 400,
        details: { originalError: message },
      };
    }

    if (message.includes('401')) {
      return {
        type: 'unauthorized',
        message: 'You are not authorized to perform this action. Please log in again.',
        statusCode: 401,
        details: { originalError: message },
      };
    }

    if (message.includes('404')) {
      return {
        type: 'not_found',
        message: 'The requested resource was not found.',
        statusCode: 404,
        details: { originalError: message },
      };
    }

    if (message.includes('500') || message.includes('Server')) {
      return {
        type: 'server',
        message: 'Server error. Please try again later or contact support.',
        statusCode: 500,
        details: { originalError: message },
      };
    }

    return {
      type: 'unknown',
      message: 'An unexpected error occurred. Please try again.',
      details: { originalError: message },
    };
  }

  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    details: { originalError: String(error) },
  };
}

export function handleAPIError(error: unknown): void {
  const apiError = parseAPIError(error);
  console.error(`[${apiError.type}] ${apiError.message}`, apiError.details);
}

export function getUserFriendlyMessage(error: APIError): string {
  const messages: Record<ErrorType, string> = {
    network: 'Network error: Please check your internet connection and try again.',
    validation: 'Please check your input and try again.',
    unauthorized: 'Your session has expired. Please log in again.',
    not_found: 'The requested resource was not found.',
    server: 'Server error. Our team has been notified. Please try again later.',
    unknown: 'Something went wrong. Please try again.',
  };

  return messages[error.type];
}
