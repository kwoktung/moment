import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HttpResponse } from "@/lib/response";
import { getSession } from "@/lib/auth/session";
import { createContext } from "@/lib/context";
import { createServices } from "@/services";
import {
  ServiceError,
  NoActiveRelationshipError,
  InvalidAttachmentsError,
  PostNotFoundError,
  WrongRelationshipError,
} from "@/lib/errors";
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
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const body = c.req.valid("json");
    const { text, attachments = [] } = body;

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Create post with attachments
    const post = await services.post.createPost(
      session.userId,
      text,
      attachments,
    );

    return c.json(post, 201);
  } catch (error) {
    if (
      error instanceof NoActiveRelationshipError ||
      error instanceof InvalidAttachmentsError
    ) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Create post error:", error);
    return HttpResponse.error(c, {
      message: "Failed to create post",
      status: 500,
    });
  }
});

postApp.openapi(queryPosts, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Get relationship posts (returns empty array if no relationship)
    const posts = await services.post.getRelationshipPosts(session.userId);

    return c.json({ posts }, 200);
  } catch (error) {
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Query posts error:", error);
    return HttpResponse.error(c, {
      message: "Failed to retrieve posts",
      status: 500,
    });
  }
});

postApp.openapi(deletePost, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const { id } = c.req.valid("param");
    const postId = parseInt(id, 10);

    if (isNaN(postId)) {
      return HttpResponse.error(c, { message: "Invalid post ID", status: 400 });
    }

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Delete post (validates ownership and relationship)
    await services.post.deletePost(session.userId, postId);

    return c.json({ message: "Post deleted successfully" }, 200);
  } catch (error) {
    if (
      error instanceof PostNotFoundError ||
      error instanceof WrongRelationshipError
    ) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Delete post error:", error);
    return HttpResponse.error(c, {
      message: "Failed to delete post",
      status: 500,
    });
  }
});

export default postApp;
