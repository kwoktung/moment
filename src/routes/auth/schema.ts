import { z } from "@hono/zod-openapi";

export const signInSchema = z.object({
  login: z.string().min(1).openapi({
    description: "Email or username",
    example: "user@example.com",
  }),
  password: z.string().min(1).openapi({
    description: "User password",
    example: "password123",
  }),
});

export const signUpSchema = z.object({
  email: z.email().openapi({
    description: "User email",
    example: "user@example.com",
  }),
  username: z.string().min(1).openapi({
    description: "Username",
    example: "johndoe",
  }),
  password: z.string().min(1).openapi({
    description: "User password",
    example: "password123",
  }),
  displayName: z.string().optional().openapi({
    description: "User full name",
    example: "John Doe",
  }),
});

export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const signInResponseSchema = z.object({
  user: userSchema,
});

export const signUpResponseSchema = z.object({
  user: userSchema,
});

export const signOutResponseSchema = z.object({
  success: z.boolean(),
});

export const sessionResponseSchema = z.object({
  user: userSchema.nullable(),
});

export const deleteAccountResponseSchema = z.object({
  success: z.boolean(),
});
