import { OpenAPIHono } from "@hono/zod-openapi";
import { HttpResponse } from "@/lib/response";
import { getDatabase } from "@/database/client";
import { userTable } from "@/database/schema";
import { eq } from "drizzle-orm";
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
import { requireAuth } from "@/lib/auth/route-helpers";

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
  const { session, context } = await requireAuth(c);

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const invitation = await services.invitation.createInvitation(session.userId);

  return c.json(
    {
      inviteCode: invitation.inviteCode,
    },
    201,
  );
});

relationshipApp.openapi(acceptInvite, async (c) => {
  const { session, context } = await requireAuth(c);

  const body = c.req.valid("json");
  const { inviteCode } = body;

  const ctx = createContext(context.env);
  const services = createServices(ctx);
  const db = getDatabase(context.env);

  const relationship = await services.invitation.acceptInvitation(
    inviteCode,
    session.userId,
  );

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
});

relationshipApp.openapi(getRelationship, async (c) => {
  const { session, context } = await requireAuth(c);

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const relationship = await services.relationship.getRelationshipWithPartner(
    session.userId,
  );

  if (!relationship) {
    return c.json({ relationship: null }, 200);
  }

  return c.json({ relationship }, 200);
});

relationshipApp.openapi(endRelationship, async (c) => {
  const { session, context } = await requireAuth(c);

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const result = await services.relationship.endRelationship(session.userId);

  return c.json(result, 200);
});

relationshipApp.openapi(resumeRelationship, async (c) => {
  const { session, context } = await requireAuth(c);

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const result = await services.relationship.resumeRelationship(session.userId);

  const statusCode = result.status === "pending_partner_approval" ? 202 : 200;
  return c.json(result, statusCode);
});

relationshipApp.openapi(cancelResumeRequest, async (c) => {
  const { session, context } = await requireAuth(c);

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const result = await services.relationship.cancelResumeRequest(
    session.userId,
  );

  return c.json(result, 200);
});

relationshipApp.openapi(getInviteCode, async (c) => {
  const { session, context } = await requireAuth(c);

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const inviteCode = await services.invitation.getOrCreateInvitation(
    session.userId,
  );

  return c.json(
    {
      inviteCode,
    },
    200,
  );
});

export default relationshipApp;
