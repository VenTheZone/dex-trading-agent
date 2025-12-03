import { toast } from "sonner";

export type ErrorCategory = 'network' | 'api' | 'validation' | 'system' | 'unknown';

export interface AppError {
  message: string;
  category: ErrorCategory;
  retryable: boolean;
}

export interface ErrorConfig {
  title: string;
  description: string;
  logPrefix?: string;
}

export const handleError = (error: unknown, config: ErrorConfig): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const logMessage = config.logPrefix 
    ? `${config.logPrefix}: ${errorMessage}` 
    : errorMessage;
  
  console.error(logMessage, error);
  
  toast.error(config.title, {
    description: config.description,
  });
};

export const ERROR_MESSAGES = {
  MODAL_OPEN: {
    title: "Failed to open trading modal",
    description: "Please try again or refresh the page.",
    logPrefix: "Error opening token modal",
  },
  NAVIGATION: {
    title: "Failed to navigate to dashboard",
    description: "Please refresh the page and try again.",
    logPrefix: "Navigation error",
  },
  PREVIEW_OPEN: {
    title: "Failed to open preview",
    description: "Please try again.",
    logPrefix: "Error showing preview",
  },
  MODAL_CLOSE: {
    title: "Failed to close modal",
    description: "Please refresh the page.",
    logPrefix: "Error closing modal",
  },
  IFRAME_LOAD: {
    title: "Failed to load Hyperliquid trading interface",
    description: "Please check your internet connection or try again later.",
    logPrefix: "Iframe loading error",
  },
  CHART_LOAD: {
    title: "Chart loading failed",
    description: "Unable to load TradingView chart. Please refresh the page.",
    logPrefix: "TradingView chart error",
  },
  CHART_SCRIPT: {
    title: "Chart script failed to load",
    description: "Please check your internet connection and try again.",
    logPrefix: "TradingView script error",
  },
  PRICE_FETCH: {
    title: "Price fetch failed",
    description: "Unable to fetch live market data. Retrying...",
    logPrefix: "Price service error",
  },
  NETWORK_ERROR: {
    title: "Network connection error",
    description: "Please check your internet connection and try again.",
    logPrefix: "Network error",
  },
  API_TIMEOUT: {
    title: "Request timeout",
    description: "The server took too long to respond. Please try again.",
    logPrefix: "API timeout error",
  },
  API_UNAVAILABLE: {
    title: "Service unavailable",
    description: "The backend service is currently unavailable. Please try again later.",
    logPrefix: "API unavailable",
  },
  MONITORING_ERROR: {
    title: "Monitoring Error",
    description: "Failed to monitor active positions. Please check your connection.",
    logPrefix: "Live monitor error",
  },
} as const;

// Enhanced error categorization
export const categorizeError = (error: unknown): {
  type: 'network' | 'timeout' | 'server' | 'client' | 'unknown';
  message: string;
  isRetryable: boolean;
} => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Network errors
  if (errorMessage.includes('fetch') || 
      errorMessage.includes('network') || 
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Failed to fetch')) {
    return {
      type: 'network',
      message: 'Network connection failed',
      isRetryable: true,
    };
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('timed out') ||
      errorMessage.includes('ETIMEDOUT')) {
    return {
      type: 'timeout',
      message: 'Request timed out',
      isRetryable: true,
    };
  }
  
  // Server errors (5xx)
  if (errorMessage.includes('500') || 
      errorMessage.includes('502') || 
      errorMessage.includes('503') ||
      errorMessage.includes('504')) {
    return {
      type: 'server',
      message: 'Server error occurred',
      isRetryable: true,
    };
  }
  
  // Client errors (4xx)
  if (errorMessage.includes('400') || 
      errorMessage.includes('401') || 
      errorMessage.includes('403') ||
      errorMessage.includes('404')) {
    return {
      type: 'client',
      message: 'Invalid request',
      isRetryable: false,
    };
  }
  
  return {
    type: 'unknown',
    message: errorMessage,
    isRetryable: true,
  };
};