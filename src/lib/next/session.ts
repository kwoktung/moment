import { cookies } from "next/headers";
import { verifyJWT, JWTPayload } from "../auth/jwt";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/config/config";

type TokenType = "access" | "refresh";

/**
 * Verifies a JWT token and validates its token type
 */
async function verifyTokenWithType(
  token: string,
  secret: string,
  expectedType: TokenType,
): Promise<JWTPayload | null> {
  const payload = await verifyJWT(token, secret);

  if (!payload) {
    return null;
  }

  // Accept tokens without tokenType or with matching tokenType
  if (!payload.tokenType || payload.tokenType === expectedType) {
    return payload;
  }

  return null;
}

/**
 * Retrieves and verifies a token from cookies
 */
async function getTokenFromCookie(
  cookieName: string,
  secret: string,
  tokenType: TokenType,
): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(cookieName);

  if (!cookie) {
    return null;
  }

  return verifyTokenWithType(cookie.value, secret, tokenType);
}

/**
 * Gets the current session by checking access token first, then falling back to refresh token
 */
export async function getSession(secret: string): Promise<JWTPayload | null> {
  // Try access token first
  const accessTokenPayload = await getTokenFromCookie(
    ACCESS_TOKEN_COOKIE_NAME,
    secret,
    "access",
  );

  if (accessTokenPayload) {
    return accessTokenPayload;
  }

  // Fall back to refresh token
  return getTokenFromCookie(REFRESH_TOKEN_COOKIE_NAME, secret, "refresh");
}
