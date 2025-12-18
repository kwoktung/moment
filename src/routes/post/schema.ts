import { z } from "zod";

export const createPostRequestSchema = z.object({
  text: z.string().min(1).openapi({
    description: "Post text content",
    example: "This is my post content",
  }),
  attachments: z
    .array(z.number().int().positive())
    .optional()
    .default([])
    .openapi({
      description: "Array of upload tracking IDs to attach to the post",
      example: [1, 2, 3],
    }),
});

export const postAttachmentSchema = z.object({
  id: z.number(),
  filename: z.string(),
  createdAt: z.string(),
});

export const queryPostAttachmentSchema = z.object({
  uri: z.string().openapi({
    description: "URI to access the attachment",
    example: "/api/attachment/1234567890-uuid.jpg",
  }),
});

export const userInfoSchema = z.object({
  id: z.number(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const postResponseSchema = z.object({
  id: z.number(),
  text: z.string(),
  createdBy: z.number(),
  user: userInfoSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  attachments: z.array(postAttachmentSchema).optional(),
});

export const queryPostsResponseSchema = z.object({
  posts: z.array(
    z.object({
      id: z.number(),
      text: z.string(),
      createdBy: z.number(),
      user: userInfoSchema.nullable(),
      createdAt: z.string(),
      updatedAt: z.string().nullable(),
      attachments: z.array(queryPostAttachmentSchema),
    }),
  ),
});

export const deletePostResponseSchema = z.object({
  message: z.string().openapi({
    description: "Success message",
    example: "Post deleted successfully",
  }),
});
