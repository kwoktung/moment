import { createRoute } from "@hono/zod-openapi";
import {
  signInSchema,
  signUpSchema,
  signInResponseSchema,
  signUpResponseSchema,
  signOutResponseSchema,
  sessionResponseSchema,
  deleteAccountResponseSchema,
} from "./schema";

// Route Definitions
export const signIn = createRoute({
  method: "post",
  tags: ["auth"],
  path: "/sign-in",
  request: {
    body: {
      content: {
        "application/json": {
          schema: signInSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: signInResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid data",
    },
    401: {
      description: "Unauthorized - Invalid credentials",
    },
  },
});

export const signUp = createRoute({
  method: "post",
  tags: ["auth"],
  path: "/sign-up",
  request: {
    body: {
      content: {
        "application/json": {
          schema: signUpSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Success",
      content: {
        "application/json": {
          schema: signUpResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid data",
    },
    409: {
      description: "Conflict - Email or username already exists",
    },
  },
});

export const signOut = createRoute({
  method: "post",
  tags: ["auth"],
  path: "/sign-out",
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: signOutResponseSchema,
        },
      },
    },
  },
});

export const getSession = createRoute({
  method: "get",
  tags: ["auth"],
  path: "/session",
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: sessionResponseSchema,
        },
      },
    },
  },
});

export const deleteAccount = createRoute({
  method: "delete",
  tags: ["auth"],
  path: "/account",
  responses: {
    200: {
      description: "Success - Account deleted",
      content: {
        "application/json": {
          schema: deleteAccountResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Not logged in",
    },
  },
});
