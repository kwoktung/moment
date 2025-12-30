import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { HttpResponse } from "@/lib/response";
import { getSession } from "@/lib/auth/session";
import { getDatabase } from "@/database/client";
import { userTable } from "@/database/schema";
import { eq } from "drizzle-orm";
import { updateAvatar, getUser } from "./definition";

const userApp = new OpenAPIHono({
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

userApp.openapi(getUser, async (c) => {
  const context = getCloudflareContext({ async: false });
  const session = await getSession(c, context.env.JWT_SECRET);

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

userApp.openapi(updateAvatar, async (c) => {
  try {
    // Check authentication
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const body = c.req.valid("json");
    const { avatar } = body;

    const db = getDatabase(context.env);
    const now = new Date();

    // Update user avatar
    const [updatedUser] = await db
      .update(userTable)
      .set({
        avatar,
        updatedAt: now,
      })
      .where(eq(userTable.id, session.userId))
      .returning({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      });

    if (!updatedUser) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(
      {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          avatar: updatedUser.avatar,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Update avatar error:", error);
    return c.json(
      {
        error: "Failed to update avatar",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default userApp;
