import { OpenAPIHono } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { HttpResponse } from "@/lib/response";
import { getDatabase } from "@/database/client";
import { attachmentTable } from "@/database/schema";
import { isNull, and, eq } from "drizzle-orm";
import { createContext } from "@/lib/context";
import { cleanupAttachments } from "./definition";

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

adminApp.openapi(cleanupAttachments, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const db = getDatabase(context.env);
    const ctx = createContext(context.env);

    // Find all attachments where postId is null
    const orphanedAttachments = await db
      .select()
      .from(attachmentTable)
      .where(
        and(isNull(attachmentTable.postId), isNull(attachmentTable.deletedAt)),
      );

    const deletedFilenames: string[] = [];
    const errors: string[] = [];

    // Delete R2 objects and database records
    for (const attachment of orphanedAttachments) {
      try {
        // Delete from R2
        await ctx.env.R2.delete(attachment.filename);

        // Delete from database
        await db
          .delete(attachmentTable)
          .where(eq(attachmentTable.id, attachment.id));

        deletedFilenames.push(attachment.filename);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to delete ${attachment.filename}: ${errorMessage}`);
        console.error(
          `Error deleting attachment ${attachment.filename}:`,
          error,
        );
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
  } catch (error) {
    console.error("Cleanup attachments error:", error);
    return HttpResponse.error(c, {
      message:
        error instanceof Error
          ? error.message
          : "Failed to cleanup attachments",
      status: 500,
    });
  }
});

export default adminApp;
