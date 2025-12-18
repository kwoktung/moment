import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { verifyJWT, type JWTPayload } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/config/config";

// Helper functions for cookie management in Hono
export function getSessionFromCookie(
  c: Context,
  secret: string,
): Promise<JWTPayload | null> {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionToken) {
    return Promise.resolve(null);
  }
  return verifyJWT(sessionToken, secret);
}

export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE_NAME, {
    path: "/",
  });
}
