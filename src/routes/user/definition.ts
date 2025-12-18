import { createRoute } from "@hono/zod-openapi";
import {
  updateAvatarRequestSchema,
  updateAvatarResponseSchema,
} from "./schema";

export const updateAvatar = createRoute({
  method: "patch",
  tags: ["user"],
  path: "/avatar",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateAvatarRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Avatar updated successfully",
      content: {
        "application/json": {
          schema: updateAvatarResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid input",
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    500: {
      description: "Internal server error - Failed to update avatar",
    },
  },
});
