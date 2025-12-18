import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import {
  createPostRequestSchema,
  postResponseSchema,
  queryPostsResponseSchema,
  deletePostResponseSchema,
} from "./schema";

export const createPost = createRoute({
  method: "post",
  tags: ["post"],
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createPostRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Post created successfully",
      content: {
        "application/json": {
          schema: postResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid input",
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    404: {
      description: "Not found - One or more attachment IDs not found",
    },
    500: {
      description: "Internal server error - Failed to create post",
    },
  },
});

export const queryPosts = createRoute({
  method: "get",
  tags: ["post"],
  path: "/",
  responses: {
    200: {
      description: "Posts retrieved successfully",
      content: {
        "application/json": {
          schema: queryPostsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    500: {
      description: "Internal server error - Failed to retrieve posts",
    },
  },
});

export const deletePost = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["post"],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        description: "Post ID to delete",
        example: "1",
      }),
    }),
  },
  responses: {
    200: {
      description: "Post deleted successfully",
      content: {
        "application/json": {
          schema: deletePostResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    403: {
      description: "Forbidden - Post does not belong to user",
    },
    404: {
      description: "Not found - Post not found",
    },
    500: {
      description: "Internal server error - Failed to delete post",
    },
  },
});
