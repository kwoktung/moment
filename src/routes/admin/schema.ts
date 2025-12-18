import { z } from "zod";
import { createSuccessResponse } from "@/lib/response";

export const cleanupAttachmentsDataSchema = z.object({
  deletedCount: z.number(),
  deletedFilenames: z.array(z.string()),
  errors: z.array(z.string()).optional(),
});

export const cleanupAttachmentsResponseSchema = createSuccessResponse(
  cleanupAttachmentsDataSchema,
);
