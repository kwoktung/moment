/**
 * Base error for all business logic errors
 * Services throw these, routes catch and map to HTTP responses
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Domain-specific errors
export class NoActiveRelationshipError extends ServiceError {
  constructor() {
    super("You must pair with a partner before performing this action", 403);
  }
}

export class InvalidCredentialsError extends ServiceError {
  constructor() {
    super("Invalid email or password", 401);
  }
}

export class InvalidInvitationError extends ServiceError {
  constructor(reason: string) {
    super(`Invalid invitation: ${reason}`, 400);
  }
}

export class AlreadyInRelationshipError extends ServiceError {
  constructor() {
    super("User is already in a relationship", 409);
  }
}

export class OwnershipError extends ServiceError {
  constructor(resource: string) {
    super(`You do not have permission to access this ${resource}`, 403);
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class DuplicateUserError extends ServiceError {
  constructor(field: "email" | "username") {
    super(`${field} already exists`, 409);
  }
}

export class InvalidAttachmentsError extends ServiceError {
  constructor(invalidIds: number[]) {
    super(
      `One or more attachment IDs not found or deleted: ${invalidIds.join(", ")}`,
      404,
    );
  }
}

export class PostNotFoundError extends ServiceError {
  constructor() {
    super("Post not found or you don't have permission to access it", 404);
  }
}

export class WrongRelationshipError extends ServiceError {
  constructor() {
    super("Post does not belong to your current relationship", 403);
  }
}
