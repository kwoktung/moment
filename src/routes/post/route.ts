import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { HttpResponse } from "@/lib/response";
import { getSessionFromCookie } from "@/lib/auth/session";
import { getDatabase } from "@/database/client";
import { postTable, attachmentTable, userTable } from "@/database/schema";
import { eq, and, isNull, inArray, desc } from "drizzle-orm";
import { createPost, queryPosts, deletePost } from "./definition";

const postApp = new OpenAPIHono({
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

postApp.openapi(createPost, async (c) => {
  try {
    // Check authentication
    const context = getCloudflareContext({ async: false });
    const session = await getSessionFromCookie(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const body = c.req.valid("json");
    const { text, attachments = [] } = body;

    const db = getDatabase(context.env);
    const now = new Date();

    // Validate attachments exist and are not deleted
    if (attachments.length > 0) {
      const validAttachments = await db
        .select()
        .from(attachmentTable)
        .where(
          and(
            inArray(attachmentTable.id, attachments),
            isNull(attachmentTable.deletedAt),
          ),
        );

      if (validAttachments.length !== attachments.length) {
        return c.json(
          {
            error: "One or more attachment IDs not found or deleted",
            invalidIds: attachments.filter(
              (id) => !validAttachments.some((att) => att.id === id),
            ),
          },
          404,
        );
      }
    }

    // Create post
    const [post] = await db
      .insert(postTable)
      .values({
        text,
        createdBy: session.userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Link attachments to post if any
    if (attachments.length > 0) {
      await db
        .update(attachmentTable)
        .set({
          postId: post.id,
          updatedAt: now,
        })
        .where(
          and(
            inArray(attachmentTable.id, attachments),
            isNull(attachmentTable.deletedAt),
          ),
        );
    }

    // Fetch attachments for response
    const postAttachments = await db
      .select()
      .from(attachmentTable)
      .where(
        and(
          eq(attachmentTable.postId, post.id),
          isNull(attachmentTable.deletedAt),
        ),
      );

    // Fetch post with user information using join
    const [postWithUser] = await db
      .select({
        post: postTable,
        user: {
          id: userTable.id,
          username: userTable.username,
          displayName: userTable.displayName,
          avatar: userTable.avatar,
        },
      })
      .from(postTable)
      .leftJoin(userTable, eq(postTable.createdBy, userTable.id))
      .where(eq(postTable.id, post.id))
      .limit(1);

    return c.json(
      {
        id: post.id,
        text: post.text,
        createdBy: post.createdBy,
        user: postWithUser?.user
          ? {
              id: postWithUser.user.id,
              username: postWithUser.user.username,
              displayName: postWithUser.user.displayName,
              avatar: postWithUser.user.avatar,
            }
          : null,
        createdAt: post.createdAt?.toISOString() || now.toISOString(),
        updatedAt: post.updatedAt?.toISOString() || null,
        attachments: postAttachments.map((att) => ({
          id: att.id,
          filename: att.filename,
          createdAt: att.createdAt?.toISOString() || now.toISOString(),
        })),
      },
      201,
    );
  } catch (error) {
    console.error("Create post error:", error);
    return c.json(
      {
        error: "Failed to create post",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

postApp.openapi(queryPosts, async (c) => {
  try {
    // Check authentication
    const context = getCloudflareContext({ async: false });
    const session = await getSessionFromCookie(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const db = getDatabase(context.env);

    // Fetch user posts with user information using join
    const postsWithUsers = await db
      .select({
        post: postTable,
        user: {
          id: userTable.id,
          username: userTable.username,
          displayName: userTable.displayName,
          avatar: userTable.avatar,
        },
      })
      .from(postTable)
      .leftJoin(userTable, eq(postTable.createdBy, userTable.id))
      .where(
        and(
          eq(postTable.createdBy, session.userId),
          isNull(postTable.deletedAt),
        ),
      )
      .orderBy(desc(postTable.createdAt));

    // Fetch attachments for all posts
    const postIds = postsWithUsers.map((item) => item.post.id);
    const allAttachments =
      postIds.length > 0
        ? await db
            .select()
            .from(attachmentTable)
            .where(
              and(
                inArray(attachmentTable.postId, postIds),
                isNull(attachmentTable.deletedAt),
              ),
            )
        : [];

    // Group attachments by postId
    const attachmentsByPostId = allAttachments.reduce(
      (acc, attachment) => {
        if (attachment.postId) {
          if (!acc[attachment.postId]) {
            acc[attachment.postId] = [];
          }
          acc[attachment.postId].push(attachment);
        }
        return acc;
      },
      {} as Record<number, typeof allAttachments>,
    );

    // Build response with posts and their attachments
    const posts = postsWithUsers.map(({ post, user }) => ({
      id: post.id,
      text: post.text,
      createdBy: post.createdBy,
      user: user
        ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
          }
        : null,
      createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: post.updatedAt?.toISOString() || null,
      attachments: (attachmentsByPostId[post.id] || []).map((att) => ({
        uri: `/api/attachment/${att.filename}`,
      })),
    }));

    return c.json({ posts }, 200);
  } catch (error) {
    console.error("Query posts error:", error);
    return c.json(
      {
        error: "Failed to retrieve posts",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

postApp.openapi(deletePost, async (c) => {
  try {
    // Check authentication
    const context = getCloudflareContext({ async: false });
    const session = await getSessionFromCookie(c, context.env.JWT_SECRET);

    if (!session) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }

    const { id } = c.req.valid("param");
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return c.json({ error: "Invalid post ID" }, 400);
    }

    const db = getDatabase(context.env);
    const now = new Date();

    // Check if post exists and belongs to user
    const [post] = await db
      .select()
      .from(postTable)
      .where(
        and(
          eq(postTable.id, postId),
          eq(postTable.createdBy, session.userId),
          isNull(postTable.deletedAt),
        ),
      )
      .limit(1);

    if (!post) {
      return c.json(
        { error: "Post not found or you don't have permission to delete it" },
        404,
      );
    }

    // Soft delete the post
    await db
      .update(postTable)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(postTable.id, postId));

    // Soft delete associated attachments
    await db
      .update(attachmentTable)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(attachmentTable.postId, postId),
          isNull(attachmentTable.deletedAt),
        ),
      );

    return c.json({ message: "Post deleted successfully" }, 200);
  } catch (error) {
    console.error("Delete post error:", error);
    return c.json(
      {
        error: "Failed to delete post",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export default postApp;
