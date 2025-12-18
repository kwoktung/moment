import { createRoute } from "@hono/zod-openapi";
import { cleanupAttachmentsResponseSchema } from "./schema";

export const cleanupAttachments = createRoute({
  method: "post",
  tags: ["admin"],
  path: "/cleanup-attachments",
  security: [
    {
      bearerAuth: [],
    },
  ],
  responses: {
    200: {
      description: "Cleanup completed successfully",
      content: {
        "application/json": {
          schema: cleanupAttachmentsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Invalid or missing bearer token",
    },
    500: {
      description: "Internal server error - Failed to cleanup attachments",
    },
  },
});
