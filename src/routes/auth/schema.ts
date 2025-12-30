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
  turnstileToken: z.string().min(1).openapi({
    description: "Cloudflare Turnstile token",
    example: "0.abcdefghijklmnopqrstuvwxyz",
  }),
});

export const signInResponseSchema = z.object({
  token: z.string().openapi({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
  refreshToken: z.string().openapi({
    description: "JWT refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
});

export const signUpResponseSchema = z.object({
  token: z.string().openapi({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
  refreshToken: z.string().openapi({
    description: "JWT refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
});

export const signOutResponseSchema = z.object({
  success: z.boolean(),
});

export const deleteAccountResponseSchema = z.object({
  success: z.boolean(),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().optional().openapi({
    description: "Refresh token (optional if sent via cookie)",
  }),
});

export const refreshTokenResponseSchema = z.object({
  token: z.string().openapi({
    description: "New JWT access token",
  }),
  refreshToken: z.string().openapi({
    description: "JWT refresh token",
  }),
});
