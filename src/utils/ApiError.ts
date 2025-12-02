class ApiError extends Error {
  statusCode: number;
  success: boolean;
  errors: Array<{ field: string; message: string }>;
  isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors: Array<{ field: string; message: string }> = [],
    stack: string = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(
    message: string,
    errors: Array<{ field: string; message: string }> = []
  ): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string = 'Resource already exists'): ApiError {
    return new ApiError(409, message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message);
  }
}

export default ApiError;