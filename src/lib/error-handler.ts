import { toast } from "sonner";

/**
 * Centralized error handling utility for consistent error messages and logging
 */

export interface ErrorConfig {
  title: string;
  description: string;
  logPrefix?: string;
}

/**
 * Handle errors with consistent logging and user feedback
 */
export function handleError(error: unknown, config: ErrorConfig): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const logMessage = config.logPrefix 
    ? `${config.logPrefix}: ${errorMessage}` 
    : errorMessage;
  
  console.error(logMessage, error);
  
  toast.error(config.title, {
    description: config.description,
  });
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => any>(
  fn: T,
  config: ErrorConfig
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result.catch((error) => {
          handleError(error, config);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      handleError(error, config);
      throw error;
    }
  }) as T;
}

/**
 * Predefined error configurations for common scenarios
 */
export const ErrorConfigs = {
  MODAL_OPEN: {
    title: 'Failed to open modal',
    description: 'Please try again or refresh the page.',
    logPrefix: 'Modal open error',
  },
  MODAL_CLOSE: {
    title: 'Failed to close modal',
    description: 'Please refresh the page if the issue persists.',
    logPrefix: 'Modal close error',
  },
  NAVIGATION: {
    title: 'Navigation failed',
    description: 'Please refresh the page and try again.',
    logPrefix: 'Navigation error',
  },
  CHART_LOAD: {
    title: 'Chart loading failed',
    description: 'Unable to load chart. Please refresh the page.',
    logPrefix: 'Chart load error',
  },
  CHART_SCRIPT: {
    title: 'Chart script failed to load',
    description: 'Please check your internet connection and try again.',
    logPrefix: 'Chart script error',
  },
  IFRAME_LOAD: {
    title: 'Failed to load trading interface',
    description: 'Please check your internet connection or try again later.',
    logPrefix: 'Iframe load error',
  },
} as const;
