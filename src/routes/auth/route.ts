import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, or } from "drizzle-orm";
import { userTable, postTable, attachmentTable } from "@/database/schema";
import { getDatabase } from "@/database/client";
import { HttpResponse } from "@/lib/response";
import {
  getSessionFromCookie,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword, createJWT } from "@/lib/auth";
import {
  signIn,
  signUp,
  signOut,
  getSession,
  deleteAccount,
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

  const token = await createJWT(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
    },
    context.env.JWT_SECRET,
  );

  setSessionCookie(c, token);

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    },
  });
});

authApp.openapi(signUp, async (c) => {
  const body = c.req.valid("json");
  const { email, username, password, displayName } = body;

  if (!email || !username || !password) {
    return c.json({ error: "Email, username, and password are required" }, 400);
  }

  const context = getCloudflareContext({ async: false });
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

  const token = await createJWT(
    {
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
    },
    context.env.JWT_SECRET,
  );

  setSessionCookie(c, token);

  return c.json(
    {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.displayName,
        avatar: newUser.avatar,
      },
    },
    201,
  );
});

authApp.openapi(signOut, async (c) => {
  clearSessionCookie(c);
  return c.json({ success: true });
});

authApp.openapi(getSession, async (c) => {
  const context = getCloudflareContext({ async: false });
  const session = await getSessionFromCookie(c, context.env.JWT_SECRET);

  if (!session) {
    return c.json({ user: null });
  }

  const db = getDatabase(context.env);
  const user = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      username: userTable.username,
      displayName: userTable.displayName,
      avatar: userTable.avatar,
    })
    .from(userTable)
    .where(eq(userTable.id, session.userId))
    .get();

  if (!user) {
    return c.json({ user: null });
  }

  return c.json({ user });
});

authApp.openapi(deleteAccount, async (c) => {
  const context = getCloudflareContext({ async: false });
  const session = await getSessionFromCookie(c, context.env.JWT_SECRET);

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
  clearSessionCookie(c);

  return c.json({ success: true });
});

export default authApp;
