import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { HTTPException } from "hono/http-exception";
import { eq, or } from "drizzle-orm";
import { userTable, postTable, attachmentTable } from "@/database/schema";
import { getDatabase } from "@/database/client";
import { HttpResponse } from "@/lib/response";
import { setAuthCookies, deleteAuthCookies } from "@/lib/auth/session";
import { deleteCookie, getCookie } from "hono/cookie";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/config/config";
import { hashPassword } from "@/lib/auth";
import { hasActiveRelationship } from "@/database/relationship-helpers";
import {
  signIn,
  signUp,
  signOut,
  deleteAccount,
  refreshToken,
} from "./definition";
import { createContext } from "@/lib/context";
import { createServices } from "@/services";
import { requireAuth } from "@/lib/auth/route-helpers";

// App Setup
const authApp = new OpenAPIHono({
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

// Route Handlers - defined inline to preserve type definitions
authApp.openapi(signIn, async (c) => {
  const body = c.req.valid("json");
  const { login, password } = body;

  if (!login || !password) {
    throw new HTTPException(400, {
      message: "Login (email or username) and password are required",
    });
  }

  const context = getCloudflareContext({ async: false });
  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const user = await services.auth.validateCredentials(login, password);

  const { accessToken, refreshToken } = await services.auth.createAuthTokens(
    user.id,
  );

  setAuthCookies(c, accessToken, refreshToken);

  return c.json({ token: accessToken, refreshToken });
});

authApp.openapi(signUp, async (c) => {
  const body = c.req.valid("json");
  const { email, username, password, displayName, turnstileToken, inviteCode } =
    body;

  if (!email || !username || !password) {
    throw new HTTPException(400, {
      message: "Email, username, and password are required",
    });
  }

  if (!turnstileToken) {
    throw new HTTPException(400, {
      message: "Turnstile verification is required",
    });
  }

  const context = getCloudflareContext({ async: false });

  // Verify Turnstile - Keep try/catch for external API call
  try {
    const turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: context.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
        }),
      },
    );

    const turnstileResult = await turnstileResponse.json<{
      success: boolean;
      "error-codes"?: string[];
    }>();

    if (!turnstileResult.success) {
      throw new HTTPException(400, {
        message: "Turnstile verification failed. Please try again.",
      });
    }
  } catch (error) {
    if (error instanceof HTTPException) throw error;

    console.error("Turnstile verification error:", error);
    throw new HTTPException(500, {
      message: "Verification service unavailable. Please try again later.",
    });
  }

  const db = getDatabase(context.env);

  const existingUser = await db
    .select()
    .from(userTable)
    .where(or(eq(userTable.email, email), eq(userTable.username, username)))
    .get();

  if (existingUser) {
    throw new HTTPException(409, {
      message:
        existingUser.email === email
          ? "Email already exists"
          : "Username already exists",
    });
  }

  const hashedPassword = await hashPassword(password);
  const ctx = createContext(context.env);
  const services = createServices(ctx);

  if (inviteCode) {
    const validation = await services.invitation.validateInvitation(inviteCode);

    if (!validation.isValid) {
      throw new HTTPException(400, {
        message: validation.reason || "Invalid invitation",
      });
    }

    const [newUser] = await db
      .insert(userTable)
      .values({
        email,
        username,
        password: hashedPassword,
        displayName: displayName || null,
      })
      .returning();

    await services.invitation.acceptInvitation(inviteCode, newUser.id);

    const { accessToken, refreshToken } = await services.auth.createAuthTokens(
      newUser.id,
    );

    setAuthCookies(c, accessToken, refreshToken);

    return c.json({ token: accessToken, refreshToken }, 201);
  }

  const [newUser] = await db
    .insert(userTable)
    .values({
      email,
      username,
      password: hashedPassword,
      displayName: displayName || null,
    })
    .returning();

  const { accessToken, refreshToken } = await services.auth.createAuthTokens(
    newUser.id,
  );

  setAuthCookies(c, accessToken, refreshToken);

  return c.json({ token: accessToken, refreshToken }, 201);
});

authApp.openapi(signOut, async (c) => {
  const context = getCloudflareContext({ async: false });
  const refreshTokenValue = getCookie(c, "refresh_token");

  if (refreshTokenValue) {
    const ctx = createContext(context.env);
    const services = createServices(ctx);
    await services.auth.revokeRefreshToken(refreshTokenValue);
  }

  deleteAuthCookies(c);

  return c.json({ success: true });
});

authApp.openapi(deleteAccount, async (c) => {
  const { session, context } = await requireAuth(c);

  const db = getDatabase(context.env);
  const userId = session.userId;

  if (await hasActiveRelationship(db, userId)) {
    throw new HTTPException(400, {
      message:
        "Cannot delete account while in an active relationship. Please end your relationship first.",
    });
  }

  const userPosts = await db
    .select({ id: postTable.id })
    .from(postTable)
    .where(eq(postTable.createdBy, userId))
    .all();

  const postIds = userPosts.map((post) => post.id);

  if (postIds.length > 0) {
    for (const postId of postIds) {
      await db
        .delete(attachmentTable)
        .where(eq(attachmentTable.postId, postId))
        .run();
    }

    await db.delete(postTable).where(eq(postTable.createdBy, userId)).run();
  }

  await db.delete(userTable).where(eq(userTable.id, userId)).run();

  deleteCookie(c, ACCESS_TOKEN_COOKIE_NAME, { path: "/" });

  return c.json({ success: true });
});

authApp.openapi(refreshToken, async (c) => {
  const context = getCloudflareContext({ async: false });
  const body = c.req.valid("json");

  let refreshTokenValue = body.refreshToken;
  if (!refreshTokenValue) {
    refreshTokenValue = getCookie(c, "refresh_token");
  }

  if (!refreshTokenValue) {
    throw new HTTPException(401, { message: "Refresh token required" });
  }

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const tokens = await services.auth.refreshAuthTokens(refreshTokenValue);

  if (!tokens) {
    throw new HTTPException(401, {
      message: "Refresh token expired or revoked",
    });
  }

  setAuthCookies(c, tokens.accessToken, tokens.refreshToken);

  return c.json({
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

export default authApp;
