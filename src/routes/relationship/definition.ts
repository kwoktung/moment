import { createRoute } from "@hono/zod-openapi";
import {
  createInviteSchema,
  createInviteResponseSchema,
  acceptInviteSchema,
  acceptInviteResponseSchema,
  getRelationshipResponseSchema,
  endRelationshipResponseSchema,
  resumeRelationshipResponseSchema,
  cancelResumeRequestResponseSchema,
  getInviteCodeResponseSchema,
  updateStartDateSchema,
  updateStartDateResponseSchema,
} from "./schema";

export const createInvite = createRoute({
  method: "post",
  tags: ["relationship"],
  path: "/invite/create",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createInviteSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Invite created successfully",
      content: {
        "application/json": {
          schema: createInviteResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid data",
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    403: {
      description:
        "Forbidden - User already has an active relationship or pending invite",
    },
  },
});

export const acceptInvite = createRoute({
  method: "post",
  tags: ["relationship"],
  path: "/invite/accept",
  request: {
    body: {
      content: {
        "application/json": {
          schema: acceptInviteSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Invite accepted successfully",
      content: {
        "application/json": {
          schema: acceptInviteResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid invite code",
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    403: {
      description:
        "Forbidden - Cannot accept own invite or already in relationship",
    },
    404: {
      description: "Not found - Invite not found or expired",
    },
  },
});

export const getRelationship = createRoute({
  method: "get",
  tags: ["relationship"],
  path: "/",
  responses: {
    200: {
      description: "Relationship info retrieved successfully",
      content: {
        "application/json": {
          schema: getRelationshipResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
  },
});

export const endRelationship = createRoute({
  method: "post",
  tags: ["relationship"],
  path: "/end",
  responses: {
    200: {
      description: "Relationship ended successfully",
      content: {
        "application/json": {
          schema: endRelationshipResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    404: {
      description: "Not found - No active relationship found",
    },
  },
});

export const resumeRelationship = createRoute({
  method: "post",
  tags: ["relationship"],
  path: "/resume",
  responses: {
    200: {
      description: "Relationship resumed successfully",
      content: {
        "application/json": {
          schema: resumeRelationshipResponseSchema,
        },
      },
    },
    202: {
      description: "Resume request sent, waiting for partner approval",
      content: {
        "application/json": {
          schema: resumeRelationshipResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    404: {
      description: "Not found - No relationship in pending deletion state",
    },
    400: {
      description: "Bad request - Grace period has expired",
    },
  },
});

export const cancelResumeRequest = createRoute({
  method: "post",
  tags: ["relationship"],
  path: "/resume/cancel",
  responses: {
    200: {
      description: "Resume request cancelled successfully",
      content: {
        "application/json": {
          schema: cancelResumeRequestResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    403: {
      description: "Forbidden - Not the requester",
    },
    404: {
      description: "Not found - No pending resume request",
    },
  },
});

export const getInviteCode = createRoute({
  method: "get",
  tags: ["relationship"],
  path: "/invite/code",
  responses: {
    200: {
      description: "User's invite code (auto-created if none exists)",
      content: {
        "application/json": {
          schema: getInviteCodeResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
  },
});

export const updateStartDate = createRoute({
  method: "post",
  tags: ["relationship"],
  path: "/start-date",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateStartDateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Relationship start date updated successfully",
      content: {
        "application/json": {
          schema: updateStartDateResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid date format",
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    404: {
      description: "Not found - No active relationship found",
    },
  },
});
