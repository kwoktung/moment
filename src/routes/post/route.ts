import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { HttpResponse } from "@/lib/response";
import { createContext } from "@/lib/context";
import { createServices } from "@/services";
import { requireAuth } from "@/lib/auth/route-helpers";
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
  const { session, context } = await requireAuth(c);

  const body = c.req.valid("json");
  const { text, attachments = [] } = body;

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const post = await services.post.createPost(
    session.userId,
    text,
    attachments,
  );

  return c.json(post, 201);
});

postApp.openapi(queryPosts, async (c) => {
  const { session, context } = await requireAuth(c);

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const posts = await services.post.getRelationshipPosts(session.userId);

  return c.json({ posts }, 200);
});

postApp.openapi(deletePost, async (c) => {
  const { session, context } = await requireAuth(c);

  const { id } = c.req.valid("param");
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    throw new HTTPException(400, { message: "Invalid post ID" });
  }

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  await services.post.deletePost(session.userId, postId);

  return c.json({ message: "Post deleted successfully" }, 200);
});

export default postApp;
