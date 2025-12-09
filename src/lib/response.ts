import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { PaginationType, HttpResponseType } from "@/types/response";
import { z } from "zod";

// Enhanced response schema with better validation
export const responseSchema = z.object({
  data: z.unknown(),
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: z.string().optional(),
});

// Response options interface
export interface ResponseOptions {
  message?: string;
  status?: ContentfulStatusCode;
  timestamp?: boolean;
}

// Error response options
export interface ErrorResponseOptions {
  message?: string;
  status?: ContentfulStatusCode;
  errorCode?: string;
  details?: string;
}

// Extended response type for errors with additional fields
export interface ErrorResponseType extends HttpResponseType<null> {
  errorCode?: string;
  details?: string;
  timestamp?: string;
}

export class HttpResponse {
  /**
   * Create a successful response
   */
  static success<T>(ctx: Context, data: T, options: ResponseOptions = {}) {
    const { message = "Success", timestamp = true } = options;

    const response: HttpResponseType<T> = {
      data,
      success: true,
      message,
      ...(timestamp && { timestamp: new Date().toISOString() }),
    };

    return ctx.json(response, 200);
  }

  /**
   * Create a paginated response
   */
  static pagination<T>(
    ctx: Context,
    data: PaginationType<T>,
    options: ResponseOptions = {},
  ) {
    const { message = "Data retrieved successfully", timestamp = true } =
      options;

    const response: HttpResponseType<PaginationType<T>> = {
      data,
      success: true,
      message,
      ...(timestamp && { timestamp: new Date().toISOString() }),
    };

    return ctx.json(response, 200);
  }

  /**
   * Create an error response
   */
  static error(ctx: Context, options: ErrorResponseOptions = {}) {
    const {
      message = "An error occurred",
      status = 500,
      errorCode,
      details,
    } = options;

    const response: ErrorResponseType = {
      data: null,
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...(errorCode && { errorCode }),
      ...(details && { details }),
    };

    return ctx.json(response, status);
  }

  /**
   * Create a not found response
   */
  static notFound(ctx: Context, message?: string) {
    return this.error(ctx, {
      message: message || "Resource not found",
      status: 404,
      errorCode: "NOT_FOUND",
    });
  }

  /**
   * Create a bad request response
   */
  static badRequest(ctx: Context, message?: string, details?: string) {
    return this.error(ctx, {
      message: message || "Bad request",
      status: 400,
      errorCode: "BAD_REQUEST",
      details,
    });
  }

  /**
   * Create an unauthorized response
   */
  static unauthorized(ctx: Context, message?: string) {
    return this.error(ctx, {
      message: message || "Unauthorized",
      status: 401,
      errorCode: "UNAUTHORIZED",
    });
  }

  /**
   * Create a forbidden response
   */
  static forbidden(ctx: Context, message?: string) {
    return this.error(ctx, {
      message: message || "Forbidden",
      status: 403,
      errorCode: "FORBIDDEN",
    });
  }

  /**
   * Create a conflict response
   */
  static conflict(ctx: Context, message?: string, details?: string) {
    return this.error(ctx, {
      message: message || "Conflict",
      status: 409,
      errorCode: "CONFLICT",
      details,
    });
  }

  /**
   * Create a validation error response
   */
  static validationError(ctx: Context, message?: string, details?: string) {
    return this.error(ctx, {
      message: message || "Validation failed",
      status: 422,
      errorCode: "VALIDATION_ERROR",
      details,
    });
  }

  /**
   * Create a created response (for POST operations)
   */
  static created<T>(
    ctx: Context,
    data: T,
    options?: Omit<ResponseOptions, "status">,
  ) {
    return this.success(ctx, data, { ...options, status: 201 });
  }
}
