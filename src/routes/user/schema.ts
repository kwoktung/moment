import { z } from "@hono/zod-openapi";

export const updateAvatarRequestSchema = z.object({
  avatar: z.union([z.string().min(1), z.null()]).openapi({
    description: "Avatar URL or filename. Set to null to clear avatar.",
    example: "https://example.com/avatar.jpg",
  }),
});

export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const updateAvatarResponseSchema = z.object({
  user: userSchema,
});
