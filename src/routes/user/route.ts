import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HttpResponse } from "@/lib/response";
import { getSession } from "@/lib/auth/session";
import { createContext } from "@/lib/context";
import { createServices } from "@/services";
import { ServiceError } from "@/lib/errors";
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

  const ctx = createContext(context.env);
  const services = createServices(ctx);

  const user = await services.user.getUserById(session.userId);

  if (!user) {
    return c.json({ user: null });
  }

  return c.json({ user });
});

userApp.openapi(updateAvatar, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const session = await getSession(c, context.env.JWT_SECRET);

    if (!session) {
      return HttpResponse.unauthorized(c, "Authentication required");
    }

    const body = c.req.valid("json");
    const { avatar } = body;

    const ctx = createContext(context.env);
    const services = createServices(ctx);

    // Update user avatar
    const user = await services.user.updateAvatar(session.userId, avatar);

    return c.json({ user }, 200);
  } catch (error) {
    if (error instanceof ServiceError) {
      return HttpResponse.error(c, {
        message: error.message,
        status: error.statusCode as ContentfulStatusCode,
      });
    }
    console.error("Update avatar error:", error);
    return HttpResponse.error(c, {
      message: "Failed to update avatar",
      status: 500,
    });
  }
});

export default userApp;
