import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { ContentfulStatusCode } from "hono/utils/http-status";
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
  getInviteCode,
} from "./definition";
import { createContext } from "@/lib/context";
import { createServices } from "@/services";
import {
  ServiceError,
  AlreadyInRelationshipError,
  InvalidInvitationError,
} from "@/lib/errors";
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
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Create invitation (validates no active relationship, deletes existing invites, generates unique code)
    const invitation = await services.invitation.createInvitation(
      session.userId,
    );

    return c.json(
      {
        inviteCode: invitation.inviteCode,
      },
      201,
    );
  } catch (error) {
    if (error instanceof AlreadyInRelationshipError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Create invite error:", error);
    return HttpResponse.error(c, {
      message: "Failed to create invitation",
      status: 500,
    });
  }
});

relationshipApp.openapi(acceptInvite, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const body = c.req.valid("json");
    const { inviteCode } = body;

    const ctx = createContext(context.env);
    const services = createServices(ctx);
    const db = getDatabase(context.env);

    // Accept invitation (validates, creates relationship, deletes invitation)
    const relationship = await services.invitation.acceptInvitation(
      inviteCode,
      session.userId,
    );

    // Get partner info (HTTP response formatting concern)
    const [partner] = await db
      .select({
        id: userTable.id,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      })
      .from(userTable)
      .where(eq(userTable.id, relationship.user1Id))
      .limit(1);

    return c.json(
      {
        relationship: {
          id: relationship.id,
          partner: {
            id: partner.id,
            username: partner.username,
            displayName: partner.displayName,
            avatar: partner.avatar,
          },
          relationshipStartDate: null,
          status: "active",
          createdAt: new Date().toISOString(),
          permanentDeletionAt: null,
          resumeRequest: null,
        },
      },
      200,
    );
  } catch (error) {
    if (
      error instanceof AlreadyInRelationshipError ||
      error instanceof InvalidInvitationError
    ) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Accept invite error:", error);
    return HttpResponse.error(c, {
      message: "Failed to accept invitation",
      status: 500,
    });
  }
});

relationshipApp.openapi(getRelationship, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Get relationship with partner info
    const relationship = await services.relationship.getRelationshipWithPartner(
      session.userId,
    );

    if (!relationship) {
      return c.json({ relationship: null }, 200);
    }

    return c.json({ relationship }, 200);
  } catch (error) {
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Get relationship error:", error);
    return HttpResponse.error(c, {
      message: "Failed to retrieve relationship information",
      status: 500,
    });
  }
});

relationshipApp.openapi(endRelationship, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // End relationship (sets to pending_deletion)
    const result = await services.relationship.endRelationship(session.userId);

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("End relationship error:", error);
    return HttpResponse.error(c, {
      message: "Failed to end relationship",
      status: 500,
    });
  }
});

relationshipApp.openapi(resumeRelationship, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Handle resume logic (3 states: request, already requested, complete)
    const result = await services.relationship.resumeRelationship(
      session.userId,
    );

    // Return appropriate status code based on state
    const statusCode = result.status === "pending_partner_approval" ? 202 : 200;
    return c.json(result, statusCode);
  } catch (error) {
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Resume relationship error:", error);
    return HttpResponse.error(c, {
      message: "Failed to resume relationship",
      status: 500,
    });
  }
});

relationshipApp.openapi(cancelResumeRequest, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Cancel resume request (validates requester)
    const result = await services.relationship.cancelResumeRequest(
      session.userId,
    );

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Cancel resume request error:", error);
    return HttpResponse.error(c, {
      message: "Failed to cancel resume request",
      status: 500,
    });
  }
});

relationshipApp.openapi(getInviteCode, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Get existing or auto-create invitation
    const inviteCode = await services.invitation.getOrCreateInvitation(
      session.userId,
    );

    return c.json(
      {
        inviteCode,
      },
      200,
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Get pending invite error:", error);
    return HttpResponse.error(c, {
      message: "Failed to get or create invitation",
      status: 500,
    });
  }
});

export default relationshipApp;
