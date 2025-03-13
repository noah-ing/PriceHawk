/**
 * Error Service
 *
 * Provides a centralized error handling framework for PriceHawk:
 * 1. Standardized error response format for API routes
 * 2. Error logging with severity levels
 * 3. Error categorization and codes
 * 4. Retry suggestions based on error type
 */

import crypto from 'crypto';

// Error categories for proper grouping
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  SCRAPING = 'scraping',
  EXTERNAL_SERVICE = 'external_service',
  RATE_LIMIT = 'rate_limit',
  NOT_FOUND = 'not_found',
  INTERNAL = 'internal',
  NETWORK = 'network'
}

// Error severity levels
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Standard error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    category: ErrorCategory;
    details?: any;
    traceId: string;
    retryable: boolean;
    retryAfter?: number;
  };
}

// Error definition interface for application errors
export interface ErrorDefinition {
  code: string;
  message: string;
  category: ErrorCategory;
  statusCode: number;
  severity: ErrorSeverity;
  retryable: boolean;
  retryAfter?: number;
}

// Standard error definitions
export const ErrorDefinitions = {
  // Validation errors
  INVALID_REQUEST: {
    code: 'INVALID_REQUEST',
    message: 'The request contains invalid parameters',
    category: ErrorCategory.VALIDATION,
    statusCode: 400,
    severity: ErrorSeverity.WARNING,
    retryable: false
  },
  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    message: 'A required field is missing',
    category: ErrorCategory.VALIDATION,
    statusCode: 400,
    severity: ErrorSeverity.WARNING,
    retryable: false
  },

  // Authentication errors
  UNAUTHENTICATED: {
    code: 'UNAUTHENTICATED',
    message: 'Authentication is required to access this resource',
    category: ErrorCategory.AUTHENTICATION,
    statusCode: 401,
    severity: ErrorSeverity.WARNING,
    retryable: false
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'The provided credentials are invalid',
    category: ErrorCategory.AUTHENTICATION,
    statusCode: 401,
    severity: ErrorSeverity.WARNING,
    retryable: false
  },
  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    message: 'Your session has expired, please log in again',
    category: ErrorCategory.AUTHENTICATION,
    statusCode: 401,
    severity: ErrorSeverity.INFO,
    retryable: false
  },

  // Authorization errors
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'You do not have permission to perform this action',
    category: ErrorCategory.AUTHORIZATION,
    statusCode: 403,
    severity: ErrorSeverity.WARNING,
    retryable: false
  },
  SUBSCRIPTION_REQUIRED: {
    code: 'SUBSCRIPTION_REQUIRED',
    message: 'This feature requires a subscription',
    category: ErrorCategory.AUTHORIZATION,
    statusCode: 403,
    severity: ErrorSeverity.INFO,
    retryable: false
  },
  PLAN_LIMIT_REACHED: {
    code: 'PLAN_LIMIT_REACHED',
    message: 'You have reached the limit for your current subscription plan',
    category: ErrorCategory.AUTHORIZATION,
    statusCode: 403,
    severity: ErrorSeverity.INFO,
    retryable: false
  },

  // Database errors
  DATABASE_CONNECTION_ERROR: {
    code: 'DATABASE_CONNECTION_ERROR',
    message: 'Unable to connect to the database',
    category: ErrorCategory.DATABASE,
    statusCode: 500,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    retryAfter: 5
  },
  DATABASE_QUERY_ERROR: {
    code: 'DATABASE_QUERY_ERROR',
    message: 'Error executing database query',
    category: ErrorCategory.DATABASE,
    statusCode: 500,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    retryAfter: 3
  },
  RECORD_NOT_FOUND: {
    code: 'RECORD_NOT_FOUND',
    message: 'The requested record was not found',
    category: ErrorCategory.NOT_FOUND,
    statusCode: 404,
    severity: ErrorSeverity.INFO,
    retryable: false
  },

  // Scraping errors
  SCRAPING_ERROR: {
    code: 'SCRAPING_ERROR',
    message: 'Error scraping product information',
    category: ErrorCategory.SCRAPING,
    statusCode: 500,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    retryAfter: 60
  },
  INVALID_URL: {
    code: 'INVALID_URL',
    message: 'The provided URL is invalid or not supported',
    category: ErrorCategory.VALIDATION,
    statusCode: 400,
    severity: ErrorSeverity.WARNING,
    retryable: false
  },
  RETAILER_NOT_SUPPORTED: {
    code: 'RETAILER_NOT_SUPPORTED',
    message: 'This retailer is not currently supported',
    category: ErrorCategory.VALIDATION,
    statusCode: 400,
    severity: ErrorSeverity.INFO,
    retryable: false
  },

  // External service errors
  EXTERNAL_SERVICE_ERROR: {
    code: 'EXTERNAL_SERVICE_ERROR',
    message: 'Error communicating with external service',
    category: ErrorCategory.EXTERNAL_SERVICE,
    statusCode: 502,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    retryAfter: 30
  },
  STRIPE_ERROR: {
    code: 'STRIPE_ERROR',
    message: 'Error processing payment',
    category: ErrorCategory.EXTERNAL_SERVICE,
    statusCode: 502,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    retryAfter: 5
  },
  EMAIL_SERVICE_ERROR: {
    code: 'EMAIL_SERVICE_ERROR',
    message: 'Error sending email',
    category: ErrorCategory.EXTERNAL_SERVICE,
    statusCode: 500,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    retryAfter: 60
  },

  // Rate limit errors
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded, please try again later',
    category: ErrorCategory.RATE_LIMIT,
    statusCode: 429,
    severity: ErrorSeverity.WARNING,
    retryable: true,
    retryAfter: 60
  },

  // Internal server errors
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    category: ErrorCategory.INTERNAL,
    statusCode: 500,
    severity: ErrorSeverity.CRITICAL,
    retryable: true,
    retryAfter: 5
  },

  // Network errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network error occurred',
    category: ErrorCategory.NETWORK,
    statusCode: 500,
    severity: ErrorSeverity.ERROR,
    retryable: true,
    retryAfter: 5
  }
};

/**
 * Application Error class that extends the built-in Error class
 * with additional properties for standardized error handling
 */
export class AppError extends Error {
  public code: string;
  public category: ErrorCategory;
  public statusCode: number;
  public severity: ErrorSeverity;
  public details?: any;
  public traceId: string;
  public retryable: boolean;
  public retryAfter?: number;
  public cause?: Error;

  constructor(
    definition: ErrorDefinition,
    details?: any,
    cause?: Error
  ) {
    super(definition.message);
    this.name = 'AppError';
    this.code = definition.code;
    this.category = definition.category;
    this.statusCode = definition.statusCode;
    this.severity = definition.severity;
    this.details = details;
    this.traceId = crypto.randomBytes(8).toString('hex');
    this.retryable = definition.retryable;
    this.retryAfter = definition.retryAfter;
    this.cause = cause;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Creates an error response object suitable for API responses
   */
  public toResponse(): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        category: this.category,
        details: this.details,
        traceId: this.traceId,
        retryable: this.retryable,
        retryAfter: this.retryAfter
      }
    };
  }
}

/**
 * Main ErrorService class that handles error creation, logging, and formatting
 */
export class ErrorService {
  /**
   * Creates an AppError from a standard error definition
   */
  public static createError(
    definition: ErrorDefinition,
    details?: any,
    cause?: Error
  ): AppError {
    return new AppError(definition, details, cause);
  }

  /**
   * Creates a custom AppError with specified properties
   */
  public static createCustomError(
    code: string,
    message: string,
    category: ErrorCategory,
    statusCode: number,
    severity: ErrorSeverity,
    retryable: boolean = false,
    retryAfter?: number,
    details?: any,
    cause?: Error
  ): AppError {
    return new AppError(
      {
        code,
        message,
        category,
        statusCode,
        severity,
        retryable,
        retryAfter
      },
      details,
      cause
    );
  }

  /**
   * Converts any error to an AppError
   */
  public static normalizeError(error: any): AppError {
    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error;
    }

    // For Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      return this.createError(
        ErrorDefinitions.DATABASE_QUERY_ERROR,
        {
          code: error.code,
          meta: error.meta,
          clientVersion: error.clientVersion
        },
        error
      );
    }

    // For Prisma connection errors
    if (error.name === 'PrismaClientInitializationError') {
      return this.createError(
        ErrorDefinitions.DATABASE_CONNECTION_ERROR,
        {
          message: error.message,
          clientVersion: error.clientVersion
        },
        error
      );
    }

    // For NextAuth errors
    if (error.type === 'CredentialsSignin') {
      return this.createError(ErrorDefinitions.INVALID_CREDENTIALS, {}, error);
    }

    // For validation errors (e.g., Zod)
    if (error.name === 'ZodError') {
      return this.createError(
        ErrorDefinitions.INVALID_REQUEST,
        {
          validationErrors: error.errors
        },
        error
      );
    }

    // For network errors
    if (error.name === 'FetchError' || error.code === 'ECONNREFUSED') {
      return this.createError(
        ErrorDefinitions.NETWORK_ERROR,
        {
          message: error.message
        },
        error
      );
    }

    // Default: create a generic internal server error
    return this.createError(
      ErrorDefinitions.INTERNAL_SERVER_ERROR,
      {
        originalError: {
          name: error.name,
          message: error.message
        }
      },
      error
    );
  }

  /**
   * Logs an error with the appropriate severity level
   */
  public static logError(error: AppError | Error): void {
    const normalizedError = this.normalizeError(error);
    const { severity, code, message, category, traceId, details } = normalizedError;

    // Log with the appropriate severity level
    switch (severity) {
      case ErrorSeverity.DEBUG:
        console.debug(`[${traceId}] [${category}] [${code}] ${message}`, details);
        break;
      case ErrorSeverity.INFO:
        console.info(`[${traceId}] [${category}] [${code}] ${message}`, details);
        break;
      case ErrorSeverity.WARNING:
        console.warn(`[${traceId}] [${category}] [${code}] ${message}`, details);
        break;
      case ErrorSeverity.ERROR:
        console.error(`[${traceId}] [${category}] [${code}] ${message}`, details);
        console.error(`[${traceId}] Stack:`, normalizedError.stack);
        break;
      case ErrorSeverity.CRITICAL:
        console.error(`[${traceId}] [${category}] [${code}] CRITICAL: ${message}`, details);
        console.error(`[${traceId}] Stack:`, normalizedError.stack);
        if (normalizedError.cause) {
          console.error(`[${traceId}] Cause:`, normalizedError.cause);
        }
        break;
      default:
        console.error(`[${traceId}] [${category}] [${code}] ${message}`, details);
    }

    // In a production environment, you would add code here to:
    // 1. Send errors to a monitoring service (e.g., Sentry, LogRocket)
    // 2. Alert on critical errors via email, SMS, or Slack
    // 3. Store errors in a database for analysis
  }

  /**
   * Handles an error by logging it and returning an appropriate response
   */
  public static handleError(error: any): { statusCode: number; response: ErrorResponse } {
    const normalizedError = this.normalizeError(error);
    this.logError(normalizedError);

    return {
      statusCode: normalizedError.statusCode,
      response: normalizedError.toResponse()
    };
  }

  /**
   * Creates a standardized success response
   */
  public static createSuccessResponse<T>(data: T): { success: true; data: T } {
    return {
      success: true,
      data
    };
  }
}

// Export a singleton instance
export default new ErrorService();
