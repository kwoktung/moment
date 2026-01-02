import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

import authApp from "@/routes/auth/route";
import postApp from "@/routes/post/route";
import attachmentApp from "@/routes/attachment/route";
import adminApp from "@/routes/admin/route";
import userApp from "@/routes/user/route";
import relationshipApp from "@/routes/relationship/route";

const basePath = "/api";

const app = new OpenAPIHono().basePath(basePath);

app.route("/auth", authApp);
app.route("/posts", postApp);
app.route("/attachment", attachmentApp);
app.route("/admin", adminApp);
app.route("/user", userApp);
app.route("/relationship", relationshipApp);

// Global error handler - catches all unhandled errors
app.onError((err, c) => {
  // Handle HTTPException (our primary error type)
  if (err instanceof HTTPException) {
    return c.json(
      {
        data: null,
        success: false,
        message: err.message,
      },
      err.status,
    );
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const firstError = err.issues[0];
    const message = firstError
      ? `${firstError.path.join(".")}: ${firstError.message}`
      : "Validation failed";

    return c.json(
      {
        data: null,
        success: false,
        message,
      },
      400,
    );
  }

  // Handle unexpected errors
  console.error("Unexpected error:", err);

  return c.json(
    {
      data: null,
      success: false,
      message:
        err instanceof Error ? err.message : "An unexpected error occurred",
    },
    500,
  );
});

// Register security scheme
app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  description: "Bearer token authentication for admin endpoints",
});

app.doc31("/docs", {
  openapi: "3.1.0",
  info: {
    title: "Moment API",
    version: "1.0.0",
  },
});

app.get(
  "/scalar",
  Scalar({
    url: `${basePath}/docs`,
    title: "Moment API",
  }),
);

export const GET = (req: Request) => app.fetch(req);
export const POST = (req: Request) => app.fetch(req);
export const PUT = (req: Request) => app.fetch(req);
export const DELETE = (req: Request) => app.fetch(req);
export const PATCH = (req: Request) => app.fetch(req);
