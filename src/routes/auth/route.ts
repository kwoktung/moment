import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { eq, or } from "drizzle-orm";
import {
  userTable,
  postTable,
  attachmentTable,
  refreshTokenTable,
  relationshipTable,
  invitationTable,
} from "@/database/schema";
import { getDatabase } from "@/database/client";
import { HttpResponse } from "@/lib/response";
import {
  getSession,
  setAuthCookies,
  deleteAuthCookies,
} from "@/lib/auth/session";
import { deleteCookie, getCookie } from "hono/cookie";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/config/config";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyJWT,
} from "@/lib/auth";
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
import { InvalidCredentialsError, ServiceError } from "@/lib/errors";

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
  try {
    const body = c.req.valid("json");
    const { login, password } = body;

    if (!login || !password) {
      return HttpResponse.badRequest(
        c,
        "Login (email or username) and password are required",
      );
    }

    const context = getCloudflareContext({ async: false });
    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Validate credentials (throws InvalidCredentialsError if invalid)
    const user = await services.auth.validateCredentials(login, password);

    // Create tokens
    const { accessToken, refreshToken } = await services.auth.createAuthTokens(
      user.id,
    );

    // Set cookies
    setAuthCookies(c, accessToken, refreshToken);

    // Return both tokens
    return c.json({ token: accessToken, refreshToken });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return HttpResponse.unauthorized(c, error.message);
    }
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Login error:", error);
    return HttpResponse.error(c, { message: "Login failed", status: 500 });
  }
});

authApp.openapi(signUp, async (c) => {
  const body = c.req.valid("json");
  const { email, username, password, displayName, turnstileToken, inviteCode } =
    body;

  if (!email || !username || !password) {
    return c.json({ error: "Email, username, and password are required" }, 400);
  }

  if (!turnstileToken) {
    return c.json({ error: "Turnstile verification is required" }, 400);
  }

  const context = getCloudflareContext({ async: false });
  const now = new Date();

  // Verify Turnstile token
  const turnstileResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    return c.json(
      {
        error: "Turnstile verification failed. Please try again.",
      },
      400,
    );
  }

  const db = getDatabase(context.env);

  const existingUser = await db
    .select()
    .from(userTable)
    .where(or(eq(userTable.email, email), eq(userTable.username, username)))
    .get();

  if (existingUser) {
    return c.json(
      {
        error:
          existingUser.email === email
            ? "Email already exists"
            : "Username already exists",
      },
      409,
    );
  }

  const hashedPassword = await hashPassword(password);

  // Process invite code if provided
  if (inviteCode) {
    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Validate invitation before creating user
    const validation = await services.invitation.validateInvitation(inviteCode);

    if (!validation.isValid) {
      return c.json({ error: validation.reason || "Invalid invitation" }, 400);
    }

    // Create user
    const [newUser] = await db
      .insert(userTable)
      .values({
        email,
        username,
        password: hashedPassword,
        displayName: displayName || null,
      })
      .returning();

    // Accept invitation (creates relationship and deletes invitation)
    await services.invitation.acceptInvitation(inviteCode, newUser.id);

    // Create tokens for new user
    const { accessToken, refreshToken } = await services.auth.createAuthTokens(
      newUser.id,
    );

    setAuthCookies(c, accessToken, refreshToken);

    return c.json({ token: accessToken, refreshToken }, 201);
  }

  // Normal signup without invite code
  const [newUser] = await db
    .insert(userTable)
    .values({
      email,
      username,
      password: hashedPassword,
      displayName: displayName || null,
    })
    .returning();

  // Create tokens for new user
  const ctx = createContext(context.env);
  const services = createServices(ctx);
  const { accessToken, refreshToken } = await services.auth.createAuthTokens(
    newUser.id,
  );

  // Set cookies
  setAuthCookies(c, accessToken, refreshToken);

  // Return both tokens
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
  const context = getCloudflareContext({ async: false });
  const session = await getSession(c, context.env.JWT_SECRET);

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = getDatabase(context.env);
  const userId = session.userId;

  // Check if user has an active relationship
  if (await hasActiveRelationship(db, userId)) {
    return c.json(
      {
        error:
          "Cannot delete account while in an active relationship. Please end your relationship first.",
      },
      400,
    );
  }

  // Get all posts created by the user to delete their attachments
  const userPosts = await db
    .select({ id: postTable.id })
    .from(postTable)
    .where(eq(postTable.createdBy, userId))
    .all();

  const postIds = userPosts.map((post) => post.id);

  // Hard delete all attachments associated with user's posts
  if (postIds.length > 0) {
    for (const postId of postIds) {
      await db
        .delete(attachmentTable)
        .where(eq(attachmentTable.postId, postId))
        .run();
    }

    // Hard delete all posts created by the user
    await db.delete(postTable).where(eq(postTable.createdBy, userId)).run();
  }

  // Hard delete the user account
  await db.delete(userTable).where(eq(userTable.id, userId)).run();

  // Clear the session cookie
  deleteCookie(c, ACCESS_TOKEN_COOKIE_NAME, { path: "/" });

  return c.json({ success: true });
});

authApp.openapi(refreshToken, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const body = c.req.valid("json");

    // Get refresh token from body or cookie
    let refreshTokenValue = body.refreshToken;
    if (!refreshTokenValue) {
      refreshTokenValue = getCookie(c, "refresh_token");
    }

    if (!refreshTokenValue) {
      return HttpResponse.unauthorized(c, "Refresh token required");
    }

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Refresh tokens (validates and rotates)
    const tokens = await services.auth.refreshAuthTokens(refreshTokenValue);

    if (!tokens) {
      return HttpResponse.unauthorized(c, "Refresh token expired or revoked");
    }

    // Set cookies with new tokens
    setAuthCookies(c, tokens.accessToken, tokens.refreshToken);

    // Return both tokens
    return c.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Token refresh error:", error);
    return HttpResponse.error(c, {
      message: "Failed to refresh token",
      status: 500,
    });
  }
});

export default authApp;
