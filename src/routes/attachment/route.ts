import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createContext } from "@/lib/context";
import { HttpResponse } from "@/lib/response";
import { getSession } from "@/lib/auth/session";
import { getDatabase } from "@/database/client";
import { attachmentTable } from "@/database/schema";
import { getAttachment, createAttachment } from "./definition";
import { createCache } from "@/lib/cache";

// Helper function to generate timestamp-based filename
// Uses crypto.randomUUID() for concurrent-safe uniqueness
function generateTimestampFilename(originalFilename?: string): string {
  const timestamp = Date.now();
  // Use crypto.randomUUID() for guaranteed uniqueness in concurrent scenarios
  const uuid = crypto.randomUUID();

  // Extract extension from original filename if available
  let extension = "";
  if (originalFilename) {
    const lastDot = originalFilename.lastIndexOf(".");
    if (lastDot !== -1) {
      extension = originalFilename.substring(lastDot);
    }
  }

  return `${timestamp}-${uuid}${extension}`;
}

const attachmentApp = new OpenAPIHono({
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

attachmentApp.openapi(createAttachment, async (c) => {
  try {
    // Check authentication
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    console.log(file);

    if (!file) {
      return HttpResponse.badRequest(c, "No file provided");
    }
    if (file.size === 0) {
      return HttpResponse.badRequest(c, "File is empty");
    }

    // Generate timestamp-based filename for R2 storage
    const filename = generateTimestampFilename(file.name);
    const fileBuffer = await file.arrayBuffer();

    // Get R2 bucket from context
    const ctx = createContext(context.env);

    // Upload file to R2 object storage
    const r2UploadResult = await ctx.env.R2.put(filename, fileBuffer, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
      customMetadata: {
        originalFilename: file.name || "",
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.userId.toString(),
      },
    });

    if (!r2UploadResult) {
      return HttpResponse.error(c, {
        message: "Failed to upload file to storage",
        status: 500,
      });
    }

    // Save attachment record to database
    const db = getDatabase(context.env);
    const now = new Date();
    const [attachmentRecord] = await db
      .insert(attachmentTable)
      .values({
        filename,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return HttpResponse.created(c, {
      id: attachmentRecord.id,
      filename,
    });
  } catch (error) {
    console.error("Attachment creation error:", error);
    return HttpResponse.error(c, {
      message:
        error instanceof Error ? error.message : "Failed to create attachment",
      status: 500,
    });
  }
});

attachmentApp.openapi(getAttachment, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const { filename } = c.req.valid("param");

    // Create cache instance with configuration
    const cache = createCache(c, {
      cacheName: "attachments",
      cacheControl: "public, max-age=31536000, immutable",
      enableLogging: true,
    });

    // Create cache key based on the request URL
    const cacheKey = new Request(c.req.url, c.req.raw);

    // Use cache with custom fetcher function
    const response = await cache.withCache(cacheKey, async () => {
      // Get R2 bucket from context
      const ctx = createContext(context.env);

      // Fetch object from R2
      const object = await ctx.env.R2.get(filename);

      if (!object) {
        return HttpResponse.notFound(c, "Attachment not found");
      }

      // Get content type from R2 metadata or default to octet-stream
      const contentType =
        object.httpMetadata?.contentType || "application/octet-stream";

      // Create response headers
      const headers = new Headers();
      headers.set("Content-Type", contentType);
      headers.set("Content-Length", object.size.toString());
      headers.set("ETag", object.httpEtag);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      // Stream the object body as response
      return new Response(object.body, {
        status: 200,
        headers,
      });
    });

    return response;
  } catch (error) {
    console.error("Attachment retrieval error:", error);
    return HttpResponse.error(c, {
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve attachment",
      status: 500,
    });
  }
});

export default attachmentApp;
