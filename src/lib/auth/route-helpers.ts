import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "./session";

/**
 * Requires authentication for a route
 * Throws HTTPException(401) if session is missing
 *
 * @param c - Hono context
 * @returns Session and Cloudflare context
 */
export async function requireAuth(c: Context) {
  const context = getCloudflareContext({ async: false });
  const session = await getSession(c, context.env.JWT_SECRET);

  if (!session) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  return { session, context };
}
