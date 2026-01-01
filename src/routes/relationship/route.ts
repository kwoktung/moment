import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { HttpResponse } from "@/lib/response";
import { getSession } from "@/lib/auth/session";
import { getDatabase } from "@/database/client";
import {
  relationshipTable,
  invitationTable,
  userTable,
} from "@/database/schema";
import { eq, and, or, desc } from "drizzle-orm";
import {
  createInvite,
  acceptInvite,
  getRelationship,
  endRelationship,
  resumeRelationship,
  cancelResumeRequest,
  validateInvite,
  getPendingInvite,
} from "./definition";
import { generateInviteCode } from "@/lib/invite-code";
import {
  getUserActiveRelationship,
  hasActiveRelationship,
  getPartnerId,
} from "@/database/relationship-helpers";

const relationshipApp = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return HttpResponse.error(c, {
        message: result.error.message,
        status: 400,
      });
    }
    return result;
  },
});

relationshipApp.openapi(createInvite, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const db = getDatabase(context.env);
    const now = new Date();

    // Check if user already has an active relationship
    if (await hasActiveRelationship(db, session.userId)) {
      return c.json({ error: "You already have an active relationship" }, 403);
    }

    // Hard delete any existing invitations for this user
    await db
      .delete(invitationTable)
      .where(eq(invitationTable.createdBy, session.userId));

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const existing = await db
        .select()
        .from(invitationTable)
        .where(eq(invitationTable.inviteCode, inviteCode))
        .limit(1);

      if (existing.length === 0) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return c.json(
        { error: "Failed to generate unique invite code. Please try again." },
        500,
      );
    }

    // Create invitation with 7-day expiry
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [invitation] = await db
      .insert(invitationTable)
      .values({
        inviteCode,
        createdBy: session.userId,
        expiresAt,
        createdAt: now,
      })
      .returning();

    return c.json(
      {
        inviteCode: invitation.inviteCode,
        expiresAt: expiresAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    console.error("Create invite error:", error);
    return c.json(
      {
        error: "Failed to create invitation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

relationshipApp.openapi(acceptInvite, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const body = c.req.valid("json");
    const { inviteCode } = body;
    const db = getDatabase(context.env);
    const now = new Date();

    // Check if user already has an active relationship
    if (await hasActiveRelationship(db, session.userId)) {
      return c.json({ error: "You already have an active relationship" }, 403);
    }

    // Find invitation
    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.inviteCode, inviteCode))
      .limit(1);

    if (!invitation) {
      return c.json({ error: "Invitation not found" }, 404);
    }

    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt < now) {
      // Hard delete expired invitation
      await db
        .delete(invitationTable)
        .where(eq(invitationTable.id, invitation.id));

      return c.json({ error: "Invitation has expired" }, 404);
    }

    if (invitation.createdBy === session.userId) {
      return c.json({ error: "You cannot accept your own invitation" }, 403);
    }

    // Check if invitation creator already has an active relationship
    if (await hasActiveRelationship(db, invitation.createdBy)) {
      return c.json(
        { error: "Invitation creator is already in a relationship" },
        400,
      );
    }

    // Create couple in a transaction
    // db.transaction
    const result = await (async (tx) => {
      // Create couple
      const [couple] = await tx
        .insert(relationshipTable)
        .values({
          user1Id: invitation.createdBy,
          user2Id: session.userId,
          status: "active",
          startDate: null, // Will be set by users later
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Hard delete the invitation after successful acceptance
      await tx
        .delete(invitationTable)
        .where(eq(invitationTable.id, invitation.id));

      return couple;
    })(db);

    // Get partner info
    const [partner] = await db
      .select({
        id: userTable.id,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      })
      .from(userTable)
      .where(eq(userTable.id, invitation.createdBy))
      .limit(1);

    return c.json(
      {
        couple: {
          id: result.id,
          partner: {
            id: partner.id,
            username: partner.username,
            displayName: partner.displayName,
            avatar: partner.avatar,
          },
          relationshipStartDate: result.startDate?.toISOString() || null,
          status: result.status,
          createdAt: result.createdAt?.toISOString() || now.toISOString(),
        },
      },
      200,
    );
  } catch (error) {
    console.error("Accept invite error:", error);
    return c.json(
      {
        error: "Failed to accept invitation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

relationshipApp.openapi(getRelationship, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const db = getDatabase(context.env);

    // Get user's active relationship
    const couple = await getUserActiveRelationship(db, session.userId);

    if (!couple) {
      return c.json({ couple: null }, 200);
    }

    // Get partner ID
    const partnerId = getPartnerId(couple, session.userId);

    // Get partner info
    const [partner] = await db
      .select({
        id: userTable.id,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      })
      .from(userTable)
      .where(eq(userTable.id, partnerId))
      .limit(1);

    if (!partner) {
      return c.json({ couple: null }, 200);
    }

    // Calculate permanent deletion date if relationship has ended
    const permanentDeletionAt = couple.endedAt
      ? new Date(couple.endedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
      : null;

    return c.json(
      {
        relationship: {
          id: couple.id,
          partner: {
            id: partner.id,
            username: partner.username,
            displayName: partner.displayName,
            avatar: partner.avatar,
          },
          relationshipStartDate: couple.startDate?.toISOString() || null,
          status: couple.status,
          createdAt:
            couple.createdAt?.toISOString() || new Date().toISOString(),
          permanentDeletionAt: permanentDeletionAt?.toISOString() || null,
          resumeRequest: couple.resumeRequestedBy
            ? {
                requestedBy: couple.resumeRequestedBy,
                requestedAt: couple.resumeRequestedAt?.toISOString() || null,
              }
            : null,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Get couple error:", error);
    return c.json(
      {
        error: "Failed to retrieve couple information",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

relationshipApp.openapi(endRelationship, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const db = getDatabase(context.env);
    const now = new Date();

    // Get user's active relationship
    const couple = await getUserActiveRelationship(db, session.userId);

    if (!couple) {
      return c.json({ error: "No active relationship found" }, 404);
    }

    // Update couple status to pending_deletion (will be hard deleted after grace period)
    await db
      .update(relationshipTable)
      .set({
        status: "pending_deletion",
        endedAt: now,
        updatedAt: now,
      })
      .where(eq(relationshipTable.id, couple.id));

    // Calculate permanent deletion date (7 days from ended date)
    const permanentDeletionAt = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    return c.json(
      {
        message:
          "Relationship ended. All posts will be permanently deleted after grace period.",
        permanentDeletionAt: permanentDeletionAt.toISOString(),
      },
      200,
    );
  } catch (error) {
    console.error("End relationship error:", error);
    return c.json(
      {
        error: "Failed to end relationship",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

relationshipApp.openapi(resumeRelationship, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const db = getDatabase(context.env);
    const now = new Date();

    // Find couple in pending_deletion status that user is part of
    const couples = await db
      .select()
      .from(relationshipTable)
      .where(
        and(
          or(
            eq(relationshipTable.user1Id, session.userId),
            eq(relationshipTable.user2Id, session.userId),
          ),
          eq(relationshipTable.status, "pending_deletion"),
        ),
      );

    if (couples.length === 0) {
      return c.json(
        { error: "No couple in pending deletion state found" },
        404,
      );
    }

    const couple = couples[0];

    // Check if grace period has expired (7 days from endedAt)
    if (couple.endedAt) {
      const permanentDeletionAt = new Date(
        couple.endedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
      if (permanentDeletionAt < now) {
        return c.json(
          {
            error: "Grace period has expired. Relationship cannot be resumed.",
          },
          400,
        );
      }
    }

    // Three-state logic:

    // State 1: No request exists yet
    if (!couple.resumeRequestedBy) {
      await db
        .update(relationshipTable)
        .set({
          resumeRequestedBy: session.userId,
          resumeRequestedAt: now,
          updatedAt: now,
        })
        .where(eq(relationshipTable.id, couple.id));

      return c.json(
        {
          message: "Resume request sent. Waiting for partner approval.",
          status: "pending_partner_approval",
          requestedBy: session.userId,
        },
        202,
      );
    }

    // State 2: Same user clicking again
    if (couple.resumeRequestedBy === session.userId) {
      return c.json(
        {
          message: "You have already requested to resume. Waiting for partner.",
          status: "pending_partner_approval",
          requestedBy: session.userId,
        },
        200,
      );
    }

    // State 3: Partner accepting - complete the resume
    await db
      .update(relationshipTable)
      .set({
        status: "active",
        endedAt: null,
        resumeRequestedBy: null,
        resumeRequestedAt: null,
        updatedAt: now,
      })
      .where(eq(relationshipTable.id, couple.id));

    return c.json(
      {
        message: "Relationship resumed successfully.",
        status: "active",
      },
      200,
    );
  } catch (error) {
    console.error("Resume relationship error:", error);
    return c.json(
      {
        error: "Failed to resume relationship",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

relationshipApp.openapi(cancelResumeRequest, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const db = getDatabase(context.env);
    const now = new Date();

    // Find couple in pending_deletion status that user is part of
    const couples = await db
      .select()
      .from(relationshipTable)
      .where(
        and(
          or(
            eq(relationshipTable.user1Id, session.userId),
            eq(relationshipTable.user2Id, session.userId),
          ),
          eq(relationshipTable.status, "pending_deletion"),
        ),
      );

    if (couples.length === 0 || !couples[0].resumeRequestedBy) {
      return c.json({ error: "No pending resume request found" }, 404);
    }

    const couple = couples[0];

    // Only the requester can cancel
    if (couple.resumeRequestedBy !== session.userId) {
      return c.json(
        { error: "Only the requester can cancel the resume request" },
        403,
      );
    }

    // Clear the resume request
    await db
      .update(relationshipTable)
      .set({
        resumeRequestedBy: null,
        resumeRequestedAt: null,
        updatedAt: now,
      })
      .where(eq(relationshipTable.id, couple.id));

    return c.json(
      {
        message: "Resume request cancelled successfully.",
      },
      200,
    );
  } catch (error) {
    console.error("Cancel resume request error:", error);
    return c.json(
      {
        error: "Failed to cancel resume request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

relationshipApp.openapi(validateInvite, async (c) => {
  try {
    const { code } = c.req.valid("query");
    const context = getCloudflareContext({ async: false });
    const db = getDatabase(context.env);
    const now = new Date();

    // Find invitation
    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.inviteCode, code))
      .limit(1);

    if (!invitation) {
      return c.json(
        {
          valid: false,
          inviter: null,
          expiresAt: null,
        },
        200,
      );
    }

    // Check if invitation has expired
    const isExpired = invitation.expiresAt && invitation.expiresAt < now;

    if (isExpired) {
      // Hard delete expired invitation
      await db
        .delete(invitationTable)
        .where(eq(invitationTable.id, invitation.id));

      return c.json(
        {
          valid: false,
          inviter: null,
          expiresAt: invitation.expiresAt?.toISOString() || null,
        },
        200,
      );
    }

    // Get inviter info
    const [inviter] = await db
      .select({
        id: userTable.id,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      })
      .from(userTable)
      .where(eq(userTable.id, invitation.createdBy))
      .limit(1);

    return c.json(
      {
        valid: true,
        inviter: inviter || null,
        expiresAt: invitation.expiresAt?.toISOString() || null,
      },
      200,
    );
  } catch (error) {
    console.error("Validate invite error:", error);
    return c.json(
      {
        valid: false,
        inviter: null,
        expiresAt: null,
      },
      200,
    );
  }
});

relationshipApp.openapi(getPendingInvite, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const db = getDatabase(context.env);
    const now = new Date();

    // Find user's invitation
    const [invitation] = await db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.createdBy, session.userId))
      .orderBy(desc(invitationTable.createdAt))
      .limit(1);

    if (!invitation) {
      return c.json({ invitation: null }, 200);
    }

    // Check if expired and delete if so
    if (invitation.expiresAt && invitation.expiresAt < now) {
      // Hard delete expired invitation
      await db
        .delete(invitationTable)
        .where(eq(invitationTable.id, invitation.id));

      return c.json({ invitation: null }, 200);
    }

    return c.json(
      {
        invitation: {
          inviteCode: invitation.inviteCode,
          expiresAt: invitation.expiresAt?.toISOString() || "",
        },
      },
      200,
    );
  } catch (error) {
    console.error("Get pending invite error:", error);
    return c.json({ invitation: null }, 200);
  }
});

export default relationshipApp;
