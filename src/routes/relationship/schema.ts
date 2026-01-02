import { z } from "@hono/zod-openapi";

export const createInviteSchema = z.object({});

export const createInviteResponseSchema = z.object({
  inviteCode: z.string().openapi({
    description: "8-character invite code (never expires)",
    example: "AB12CD34",
  }),
});

export const acceptInviteSchema = z.object({
  inviteCode: z.string().length(8).openapi({
    description: "8-character invite code",
    example: "AB12CD34",
  }),
});

export const userInfoSchema = z.object({
  id: z.number(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const relationshipInfoSchema = z.object({
  id: z.number(),
  partner: userInfoSchema,
  relationshipStartDate: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  permanentDeletionAt: z.string().nullable(),
  resumeRequest: z
    .object({
      requestedBy: z.number(),
      requestedAt: z.string(),
    })
    .nullable(),
});

export const acceptInviteResponseSchema = z.object({
  relationship: relationshipInfoSchema,
});

export const getRelationshipResponseSchema = z.object({
  relationship: relationshipInfoSchema.nullable(),
});

export const endRelationshipResponseSchema = z.object({
  message: z.string(),
  permanentDeletionAt: z.string(),
});

export const resumeRelationshipResponseSchema = z.object({
  message: z.string(),
  status: z.string(),
  requestedBy: z.number().optional(),
});

export const cancelResumeRequestResponseSchema = z.object({
  message: z.string(),
});

export const getInviteCodeResponseSchema = z.object({
  inviteCode: z.string().openapi({
    description: "8-character invite code (auto-created if none exists)",
    example: "AB12CD34",
  }),
});
