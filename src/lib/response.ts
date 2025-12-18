import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { PaginationType, HttpResponseType } from "@/types/response";
import { z } from "zod";

// Enhanced response schema with better validation
export const responseSchema = z.object({
  data: z.unknown(),
  success: z.boolean(),
  message: z.string().optional(),
});

// Pagination schema for meta information
export const PaginationSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative().optional(),
});

// Generic success response wrapper
export const createSuccessResponse = <T extends z.ZodType>(dataSchema: T) => {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
};

// Paginated response wrapper
export const createPaginatedResponse = <T extends z.ZodType>(dataSchema: T) => {
  return z.object({
    success: z.literal(true),
    data: z.array(dataSchema),
    pagination: PaginationSchema,
  });
};

// Response options interface
export interface ResponseOptions {
  message?: string;
  status?: ContentfulStatusCode;
}

export class HttpResponse {
  /**
   * Create a successful response
   */
  static success<T>(ctx: Context, data: T, options: ResponseOptions = {}) {
    const { status = 200 as ContentfulStatusCode } = options;

    const response = {
      success: true as const,
      data,
    };

    return ctx.json(response, status);
  }

  /**
   * Create a paginated response
   */
  static pagination<T>(
    ctx: Context,
    data: PaginationType<T>,
    options: ResponseOptions = {},
  ) {
    const { status = 200 } = options;
    const total = data.total;
    const items = data.items;

    const response = {
      success: true as const,
      data: items,
      pagination: {
        total,
      },
    };

    return ctx.json(response, status);
  }

  /**
   * Create an error response
   */
  static error(ctx: Context, options: ResponseOptions = {}) {
    const { message = "An error occurred", status = 500 } = options;

    const response: HttpResponseType<null> = {
      data: null,
      success: false,
      message,
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
    });
  }

  /**
   * Create a bad request response
   */
  static badRequest(ctx: Context, message?: string) {
    return this.error(ctx, {
      message: message || "Bad request",
      status: 400,
    });
  }

  /**
   * Create an unauthorized response
   */
  static unauthorized(ctx: Context, message?: string) {
    return this.error(ctx, {
      message: message || "Unauthorized",
      status: 401,
    });
  }

  /**
   * Create a forbidden response
   */
  static forbidden(ctx: Context, message?: string) {
    return this.error(ctx, {
      message: message || "Forbidden",
      status: 403,
    });
  }

  /**
   * Create a conflict response
   */
  static conflict(ctx: Context, message?: string) {
    return this.error(ctx, {
      message: message || "Conflict",
      status: 409,
    });
  }

  /**
   * Create a validation error response
   */
  static validationError(ctx: Context, message?: string) {
    return this.error(ctx, {
      message: message || "Validation failed",
      status: 422,
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
