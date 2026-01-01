import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { createContext } from "@/lib/context";
import { HttpResponse } from "@/lib/response";
import { getSession } from "@/lib/auth/session";
import { createServices } from "@/services";
import { ServiceError } from "@/lib/errors";
import { getAttachment, createAttachment } from "./definition";
import { createCache } from "@/lib/cache";

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
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return HttpResponse.badRequest(c, "No file provided");
    }

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Upload attachment to R2 and create database record
    const attachment = await services.attachment.uploadAttachment(
      file,
      session.userId,
    );

    return HttpResponse.created(c, attachment);
  } catch (error) {
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Attachment creation error:", error);
    return HttpResponse.error(c, {
      message: "Failed to create attachment",
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
      const ctx = createContext(context.env);
      const services = createServices(ctx);

      // Fetch object from R2 via service
      const object = await services.attachment.getAttachment(filename);

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
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Attachment retrieval error:", error);
    return HttpResponse.error(c, {
      message: "Failed to retrieve attachment",
      status: 500,
    });
  }
});

export default attachmentApp;
