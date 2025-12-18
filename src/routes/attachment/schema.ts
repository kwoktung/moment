import { z } from "zod";
import { createSuccessResponse } from "@/lib/response";

export const getAttachmentParamsSchema = z.object({
  filename: z.string().openapi({
    description: "The filename of the attachment to retrieve",
    example: "1234567890-abc123-def456.jpg",
  }),
});

export const createAttachmentRequestSchema = z.object({
  file: z.instanceof(File).openapi({
    description: "The file to upload as an attachment",
    type: "object",
  }),
});

export const createAttachmentDataSchema = z.object({
  id: z.number(),
  filename: z.string(),
});

export const createAttachmentResponseSchema = createSuccessResponse(
  createAttachmentDataSchema,
);
