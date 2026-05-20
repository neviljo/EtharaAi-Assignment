export class AppError extends Error {
  constructor(message, code, statusCode, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized. Please log in.") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden. You don't have permission.") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", id = "") {
    const msg = id ? `${resource} not found: ${id}` : `${resource} not found.`;
    super(msg, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, "CONFLICT", 409);
  }
}
