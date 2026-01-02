import { OpenAPIHono } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { HttpResponse } from "@/lib/response";
import { getDatabase } from "@/database/client";
import {
  attachmentTable,
  relationshipTable,
  postTable,
} from "@/database/schema";
import { isNull, eq } from "drizzle-orm";
import { createContext } from "@/lib/context";
import {
  cleanupOrphanedAttachments,
  cleanupDeletedCouples,
} from "./definition";

const adminApp = new OpenAPIHono({
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

// Apply bearer auth middleware to all admin routes
adminApp.use("/*", async (c, next) => {
  const context = getCloudflareContext({ async: false });
  const middleware = bearerAuth({ token: context.env.ADMIN_TOKEN });
  return middleware(c, next);
});

adminApp.openapi(cleanupOrphanedAttachments, async (c) => {
  const context = getCloudflareContext({ async: false });
  const db = getDatabase(context.env);
  const ctx = createContext(context.env);

  const orphanedAttachments = await db
    .select()
    .from(attachmentTable)
    .where(isNull(attachmentTable.postId));

  const deletedFilenames: string[] = [];
  const errors: string[] = [];

  // Keep inner try/catch for partial failure handling
  for (const attachment of orphanedAttachments) {
    try {
      await ctx.env.R2.delete(attachment.filename);

      await db
        .delete(attachmentTable)
        .where(eq(attachmentTable.id, attachment.id));

      deletedFilenames.push(attachment.filename);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(`Failed to delete ${attachment.filename}: ${errorMessage}`);
      console.error(`Error deleting attachment ${attachment.filename}:`, error);
    }
  }

  const responseData: {
    deletedCount: number;
    deletedFilenames: string[];
    errors?: string[];
  } = {
    deletedCount: deletedFilenames.length,
    deletedFilenames,
  };

  if (errors.length > 0) {
    responseData.errors = errors;
  }

  return HttpResponse.success(c, responseData);
});

adminApp.openapi(cleanupDeletedCouples, async (c) => {
  const context = getCloudflareContext({ async: false });
  const db = getDatabase(context.env);
  const now = new Date();

  const pendingRelationships = await db
    .select()
    .from(relationshipTable)
    .where(eq(relationshipTable.status, "pending_deletion"))
    .all();

  const relationshipsToDelete = pendingRelationships.filter((relationship) => {
    if (!relationship.endedAt) return false;
    const permanentDeletionAt = new Date(
      relationship.endedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
    );
    return permanentDeletionAt <= now;
  });

  if (relationshipsToDelete.length === 0) {
    return HttpResponse.success(c, {
      message: "No relationships to clean up",
      deletedCount: 0,
      stats: {
        relationships: 0,
        posts: 0,
        attachments: 0,
      },
    });
  }

  let totalPostsDeleted = 0;
  let totalAttachmentsDeleted = 0;

  for (const relationship of relationshipsToDelete) {
    const posts = await db
      .select({ id: postTable.id })
      .from(postTable)
      .where(eq(postTable.relationshipId, relationship.id))
      .all();

    if (posts.length > 0) {
      const postIds = posts.map((p) => p.id);

      for (const postId of postIds) {
        const deletedAttachments = await db
          .delete(attachmentTable)
          .where(eq(attachmentTable.postId, postId))
          .run();
        totalAttachmentsDeleted += deletedAttachments.meta.changes || 0;
      }

      await db
        .delete(postTable)
        .where(eq(postTable.relationshipId, relationship.id))
        .run();

      totalPostsDeleted += posts.length;
    }

    await db
      .delete(relationshipTable)
      .where(eq(relationshipTable.id, relationship.id));
  }

  console.log(
    `Cleanup completed: ${relationshipsToDelete.length} relationships, ${totalPostsDeleted} posts, ${totalAttachmentsDeleted} attachments`,
  );

  return HttpResponse.success(c, {
    message: "Cleanup completed successfully",
    deletedCount: relationshipsToDelete.length,
    stats: {
      relationships: relationshipsToDelete.length,
      posts: totalPostsDeleted,
      attachments: totalAttachmentsDeleted,
    },
  });
});

export default adminApp;
