/**
 * Handle Square API errors and return user-friendly messages
 */
export function handleSquareError(error: any): string {
  const errors = error.errors || [];

  for (const err of errors) {
    switch (err.code) {
      case 'CARD_DECLINED':
        return 'Your card was declined. Please try another payment method.';

      case 'INSUFFICIENT_FUNDS':
        return 'Insufficient funds. Please try another card.';

      case 'CARD_EXPIRED':
        return 'Your card has expired. Please use a different card.';

      case 'CVV_FAILURE':
        return 'Invalid CVV. Please check your security code.';

      case 'ADDRESS_VERIFICATION_FAILURE':
        return 'Address verification failed. Please check your billing address.';

      case 'INVALID_CARD':
        return 'Invalid card information. Please check and try again.';

      case 'GENERIC_DECLINE':
        return 'Payment declined. Please try a different payment method.';

      case 'INVALID_ACCOUNT':
        return 'Invalid account. Please contact support.';

      case 'TRANSACTION_LIMIT':
        return 'Transaction limit exceeded. Please try again later.';

      case 'NOT_FOUND':
        return 'Payment resource not found. Please try again.';

      case 'RATE_LIMITED':
        return 'Too many requests. Please try again in a moment.';

      default:
        return err.detail || 'Payment processing failed. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is a Square API error
 */
export function isSquareError(error: any): boolean {
  return error && Array.isArray(error.errors) && error.errors.length > 0;
}

/**
 * Log Square error details for debugging
 */
export function logSquareError(error: any, context: string): void {
  console.error(`[Square Error - ${context}]`, {
    errors: error.errors || [],
    statusCode: error.statusCode,
    message: error.message,
    stack: error.stack,
  });
}
