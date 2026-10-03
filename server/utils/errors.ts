export type StandardErrorCode =
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'REQUEST_TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'FRESHDESK_SERVER_ERROR'
  | 'INTERNAL_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'GUARDRAIL_VIOLATION';

export class AppError extends Error {
  public readonly code: StandardErrorCode;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly retryAfterSeconds?: number;
  public readonly details?: any;

  constructor(params: {
    code: StandardErrorCode;
    message: string;
    statusCode: number;
    retryable?: boolean;
    retryAfterSeconds?: number;
    details?: any;
  }) {
    super(params.message);
    this.name = this.constructor.name;
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.retryable = params.retryable ?? false;
    this.retryAfterSeconds = params.retryAfterSeconds;
    this.details = params.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        retryable: this.retryable,
        ...(this.retryAfterSeconds ? { retry_after_seconds: this.retryAfterSeconds } : {}),
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Freshdesk rate limit reached.', retryAfterSeconds?: number) {
    super({
      code: 'RATE_LIMITED',
      message,
      statusCode: 429,
      retryable: true,
      retryAfterSeconds: retryAfterSeconds || 60,
    });
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Invalid Freshdesk API credentials.') {
    super({
      code: 'UNAUTHORIZED',
      message,
      statusCode: 401,
      retryable: false,
    });
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden for current Freshdesk credentials.') {
    super({
      code: 'FORBIDDEN',
      message,
      statusCode: 403,
      retryable: false,
    });
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super({
      code: 'NOT_FOUND',
      message: `${resource} not found.`,
      statusCode: 404,
      retryable: false,
    });
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request to Freshdesk upstream timed out.') {
    super({
      code: 'REQUEST_TIMEOUT',
      message,
      statusCode: 408,
      retryable: true,
    });
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      statusCode: 400,
      retryable: false,
      details,
    });
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class GuardrailError extends AppError {
  constructor(message: string) {
    super({
      code: 'GUARDRAIL_VIOLATION',
      message,
      statusCode: 403,
      retryable: false,
    });
    Object.setPrototypeOf(this, GuardrailError.prototype);
  }
}

export function normalizeHttpStatusError(status: number, rawMessage?: string, retryAfter?: number): AppError {
  switch (status) {
    case 401:
      return new AuthenticationError(rawMessage || 'Freshdesk authentication failed. Check your API key.');
    case 403:
      return new ForbiddenError(rawMessage || 'Insufficient permissions to perform this Freshdesk operation.');
    case 404:
      return new NotFoundError('Freshdesk ticket or resource');
    case 408:
      return new TimeoutError(rawMessage || 'Freshdesk request timed out.');
    case 429:
      return new RateLimitError(rawMessage || 'Freshdesk rate limit reached. Please back off.', retryAfter);
    case 500:
    case 502:
    case 503:
    case 504:
      return new AppError({
        code: 'FRESHDESK_SERVER_ERROR',
        message: `Freshdesk upstream server error (HTTP ${status}).`,
        statusCode: status,
        retryable: true,
      });
    default:
      return new AppError({
        code: 'INTERNAL_ERROR',
        message: rawMessage || `Unexpected upstream response (HTTP ${status}).`,
        statusCode: status,
        retryable: status >= 500,
      });
  }
}
