/**
 * Centralized error handling utilities for KnowYourRights AI
 */

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  API: 'API_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  STORAGE: 'STORAGE_ERROR',
  MEDIA: 'MEDIA_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

/**
 * Enhanced error class with additional context
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, context = {}) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.context = context
    this.timestamp = new Date().toISOString()
  }
}

/**
 * Error handler for API calls
 */
export const handleApiError = (error, context = {}) => {
  console.error('API Error:', error, context)
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status
    const message = error.response.data?.message || error.message
    
    switch (status) {
      case 401:
        return new AppError('Authentication failed. Please check your API keys.', ERROR_TYPES.API, ERROR_SEVERITY.HIGH, context)
      case 403:
        return new AppError('Access denied. You may need a premium subscription.', ERROR_TYPES.PERMISSION, ERROR_SEVERITY.MEDIUM, context)
      case 429:
        return new AppError('Rate limit exceeded. Please try again later.', ERROR_TYPES.API, ERROR_SEVERITY.MEDIUM, context)
      case 500:
        return new AppError('Server error. Please try again later.', ERROR_TYPES.API, ERROR_SEVERITY.HIGH, context)
      default:
        return new AppError(message, ERROR_TYPES.API, ERROR_SEVERITY.MEDIUM, context)
    }
  } else if (error.request) {
    // Network error
    return new AppError('Network error. Please check your connection.', ERROR_TYPES.NETWORK, ERROR_SEVERITY.HIGH, context)
  } else {
    // Other error
    return new AppError(error.message, ERROR_TYPES.UNKNOWN, ERROR_SEVERITY.MEDIUM, context)
  }
}

/**
 * Error handler for media/recording operations
 */
export const handleMediaError = (error, context = {}) => {
  console.error('Media Error:', error, context)
  
  if (error.name === 'NotAllowedError') {
    return new AppError('Camera/microphone access denied. Please check your browser permissions.', ERROR_TYPES.PERMISSION, ERROR_SEVERITY.HIGH, context)
  } else if (error.name === 'NotFoundError') {
    return new AppError('No camera or microphone found. Please check your device.', ERROR_TYPES.MEDIA, ERROR_SEVERITY.HIGH, context)
  } else if (error.name === 'NotSupportedError') {
    return new AppError('Recording not supported on this device or browser.', ERROR_TYPES.MEDIA, ERROR_SEVERITY.HIGH, context)
  } else {
    return new AppError('Media error occurred. Please try again.', ERROR_TYPES.MEDIA, ERROR_SEVERITY.MEDIUM, context)
  }
}

/**
 * Error handler for storage operations
 */
export const handleStorageError = (error, context = {}) => {
  console.error('Storage Error:', error, context)
  
  if (error.name === 'QuotaExceededError') {
    return new AppError('Storage quota exceeded. Please clear some data or upgrade to premium.', ERROR_TYPES.STORAGE, ERROR_SEVERITY.MEDIUM, context)
  } else {
    return new AppError('Storage error occurred. Your data may not be saved.', ERROR_TYPES.STORAGE, ERROR_SEVERITY.MEDIUM, context)
  }
}

/**
 * Generic error handler that routes to specific handlers
 */
export const handleError = (error, context = {}) => {
  // If it's already an AppError, return as is
  if (error instanceof AppError) {
    return error
  }
  
  // Route to specific handlers based on error characteristics
  if (error.response || error.request) {
    return handleApiError(error, context)
  } else if (error.name && error.name.includes('Media')) {
    return handleMediaError(error, context)
  } else if (error.name === 'QuotaExceededError') {
    return handleStorageError(error, context)
  } else {
    return new AppError(error.message || 'An unexpected error occurred', ERROR_TYPES.UNKNOWN, ERROR_SEVERITY.MEDIUM, context)
  }
}

/**
 * Error reporting utility (can be extended with external services)
 */
export const reportError = (error, context = {}) => {
  const errorReport = {
    message: error.message,
    type: error.type || ERROR_TYPES.UNKNOWN,
    severity: error.severity || ERROR_SEVERITY.MEDIUM,
    timestamp: error.timestamp || new Date().toISOString(),
    context: { ...error.context, ...context },
    stack: error.stack,
    userAgent: navigator.userAgent,
    url: window.location.href
  }
  
  // Log to console in development
  if (import.meta.env.VITE_APP_ENVIRONMENT === 'development') {
    console.error('Error Report:', errorReport)
  }
  
  // Send to error reporting service in production
  if (import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true' && import.meta.env.VITE_APP_ENVIRONMENT === 'production') {
    // TODO: Integrate with error reporting service (e.g., Sentry, LogRocket)
    console.log('Would send error report to external service:', errorReport)
  }
  
  return errorReport
}

/**
 * User-friendly error messages
 */
export const getUserFriendlyMessage = (error) => {
  if (error instanceof AppError) {
    return error.message
  }
  
  // Fallback messages for common error types
  const fallbackMessages = {
    [ERROR_TYPES.NETWORK]: 'Connection problem. Please check your internet and try again.',
    [ERROR_TYPES.API]: 'Service temporarily unavailable. Please try again later.',
    [ERROR_TYPES.PERMISSION]: 'Permission required. Please check your browser settings.',
    [ERROR_TYPES.STORAGE]: 'Storage issue. Please free up space or try again.',
    [ERROR_TYPES.MEDIA]: 'Camera or microphone issue. Please check your device settings.',
    [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
    [ERROR_TYPES.UNKNOWN]: 'Something went wrong. Please try again.'
  }
  
  return fallbackMessages[error.type] || fallbackMessages[ERROR_TYPES.UNKNOWN]
}

/**
 * Retry utility for failed operations
 */
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw handleError(error, { attempt, maxRetries })
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
    }
  }
  
  throw lastError
}
