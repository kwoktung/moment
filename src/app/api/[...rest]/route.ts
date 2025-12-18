import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";

import authApp from "@/routes/auth/route";
import postApp from "@/routes/post/route";
import attachmentApp from "@/routes/attachment/route";
import adminApp from "@/routes/admin/route";
import userApp from "@/routes/user/route";

const basePath = "/api";

const app = new OpenAPIHono().basePath(basePath);

app.route("/auth", authApp);
app.route("/posts", postApp);
app.route("/attachment", attachmentApp);
app.route("/admin", adminApp);
app.route("/user", userApp);

// Register security scheme
app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  description: "Bearer token authentication for admin endpoints",
});

app.doc31("/docs", {
  openapi: "3.1.0",
  info: {
    title: "Journal API",
    version: "1.0.0",
  },
});

app.get(
  "/scalar",
  Scalar({
    url: `${basePath}/docs`,
    title: "Journal API",
  }),
);

export const GET = (req: Request) => app.fetch(req);
export const POST = (req: Request) => app.fetch(req);
export const PUT = (req: Request) => app.fetch(req);
export const DELETE = (req: Request) => app.fetch(req);
export const PATCH = (req: Request) => app.fetch(req);
