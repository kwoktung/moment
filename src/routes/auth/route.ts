import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, or, and, isNull } from "drizzle-orm";
import {
  userTable,
  postTable,
  attachmentTable,
  refreshTokenTable,
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
import {
  signIn,
  signUp,
  signOut,
  deleteAccount,
  refreshToken,
} from "./definition";

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
    return c.json(
      { error: "Login (email or username) and password are required" },
      400,
    );
  }

  const context = getCloudflareContext({ async: false });
  const db = getDatabase(context.env);

  const user = await db
    .select()
    .from(userTable)
    .where(or(eq(userTable.email, login), eq(userTable.username, login)))
    .get();

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  // Create access token (15 min)
  const accessToken = await createAccessToken(
    {
      userId: user.id,
    },
    context.env.JWT_SECRET,
  );

  // Create refresh token (7 days)
  const refreshTokenValue = await createRefreshToken(
    {
      userId: user.id,
    },
    context.env.JWT_SECRET,
  );

  // Store refresh token hash in database
  const tokenHash = await hashToken(refreshTokenValue);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokenTable).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  // Set cookies
  setAuthCookies(c, accessToken, refreshTokenValue);

  // Return both tokens
  return c.json({ token: accessToken, refreshToken: refreshTokenValue });
});

authApp.openapi(signUp, async (c) => {
  const body = c.req.valid("json");
  const { email, username, password, displayName, turnstileToken } = body;

  if (!email || !username || !password) {
    return c.json({ error: "Email, username, and password are required" }, 400);
  }

  if (!turnstileToken) {
    return c.json({ error: "Turnstile verification is required" }, 400);
  }

  const context = getCloudflareContext({ async: false });
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

  const [newUser] = await db
    .insert(userTable)
    .values({
      email,
      username,
      password: hashedPassword,
      displayName: displayName || null,
    })
    .returning();

  // Create access token (15 min)
  const accessToken = await createAccessToken(
    {
      userId: newUser.id,
    },
    context.env.JWT_SECRET,
  );

  // Create refresh token (7 days)
  const refreshTokenValue = await createRefreshToken(
    {
      userId: newUser.id,
    },
    context.env.JWT_SECRET,
  );

  // Store refresh token hash in database
  const tokenHash = await hashToken(refreshTokenValue);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokenTable).values({
    userId: newUser.id,
    tokenHash,
    expiresAt,
  });

  // Set cookies
  setAuthCookies(c, accessToken, refreshTokenValue);

  // Return both tokens
  return c.json({ token: accessToken, refreshToken: refreshTokenValue }, 201);
});

authApp.openapi(signOut, async (c) => {
  const context = getCloudflareContext({ async: false });
  const db = getDatabase(context.env);

  const refreshTokenValue = getCookie(c, "refresh_token");

  if (refreshTokenValue) {
    const tokenHash = await hashToken(refreshTokenValue);
    await db
      .update(refreshTokenTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokenTable.tokenHash, tokenHash))
      .run();
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

  // Get all posts created by the user to delete their attachments
  const userPosts = await db
    .select({ id: postTable.id })
    .from(postTable)
    .where(eq(postTable.createdBy, userId))
    .all();

  const postIds = userPosts.map((post) => post.id);

  // Soft delete all attachments associated with user's posts
  if (postIds.length > 0) {
    for (const postId of postIds) {
      await db
        .update(attachmentTable)
        .set({ deletedAt: new Date() })
        .where(eq(attachmentTable.postId, postId))
        .run();
    }

    // Soft delete all posts created by the user
    await db
      .update(postTable)
      .set({ deletedAt: new Date() })
      .where(eq(postTable.createdBy, userId))
      .run();
  }

  // Delete the user account
  await db.delete(userTable).where(eq(userTable.id, userId)).run();

  // Clear the session cookie
  deleteCookie(c, ACCESS_TOKEN_COOKIE_NAME, { path: "/" });

  return c.json({ success: true });
});

authApp.openapi(refreshToken, async (c) => {
  const context = getCloudflareContext({ async: false });
  const body = c.req.valid("json");

  // Get refresh token from body or cookie
  let refreshTokenValue = body.refreshToken;
  if (!refreshTokenValue) {
    refreshTokenValue = getCookie(c, "refresh_token");
  }

  if (!refreshTokenValue) {
    return c.json({ error: "Refresh token required" }, 401);
  }

  // Verify token
  const payload = await verifyJWT(refreshTokenValue, context.env.JWT_SECRET);

  if (!payload || payload.tokenType !== "refresh") {
    return c.json({ error: "Invalid refresh token" }, 401);
  }

  // Check database
  const db = getDatabase(context.env);
  const tokenHash = await hashToken(refreshTokenValue);

  const storedToken = await db
    .select()
    .from(refreshTokenTable)
    .where(
      and(
        eq(refreshTokenTable.tokenHash, tokenHash),
        isNull(refreshTokenTable.revokedAt),
      ),
    )
    .get();

  if (!storedToken || storedToken.expiresAt < new Date()) {
    return c.json({ error: "Refresh token expired or revoked" }, 401);
  }

  // Issue new access token
  const newAccessToken = await createAccessToken(
    {
      userId: payload.userId,
    },
    context.env.JWT_SECRET,
  );

  // Set cookies (using the same refresh token that was provided)
  setAuthCookies(c, newAccessToken, refreshTokenValue);

  // Return both tokens (using the same refresh token that was provided)
  return c.json({ token: newAccessToken, refreshToken: refreshTokenValue });
});

export default authApp;
