/**
 * Base class for business-rule errors. Thrown by services when an
 * operation cannot proceed for a domain reason (not a bug, not auth).
 *
 * handleRouteError maps these to their declared HTTP status + code.
 */
export class BusinessError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "BusinessError";
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends BusinessError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends BusinessError {
  constructor(message = "Resource already exists", code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class BusinessRuleError extends BusinessError {
  constructor(message = "Operation not allowed", code = "BUSINESS_RULE") {
    super(message, 400, code);
  }
}