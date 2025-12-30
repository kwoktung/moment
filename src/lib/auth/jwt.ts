import { SignJWT, jwtVerify, decodeJwt } from "jose";

export interface JWTPayload {
  userId: number;
  tokenType?: "access" | "refresh";
  iat?: number;
  exp?: number;
}

const JWT_EXPIRATION = "7d";
const ACCESS_TOKEN_EXPIRATION = "15m";
const REFRESH_TOKEN_EXPIRATION = "7d";

export async function createJWT(
  payload: Omit<JWTPayload, "iat" | "exp">,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secretKey);
}

export async function verifyJWT(
  token: string,
  secret: string,
): Promise<JWTPayload | null> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Decodes JWT without verification to check expiration
 * Returns null if token cannot be decoded
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const decoded = decodeJwt(token);
    return decoded as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 * Returns true if expired, false if not expired, null if token cannot be decoded
 */
export function isTokenExpired(token: string): boolean | null {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

export async function createAccessToken(
  payload: Omit<JWTPayload, "iat" | "exp" | "tokenType">,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  return new SignJWT({ ...payload, tokenType: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .sign(secretKey);
}

export async function createRefreshToken(
  payload: Omit<JWTPayload, "iat" | "exp" | "tokenType">,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const token = await new SignJWT({ ...payload, tokenType: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION)
    .sign(secretKey);

  return token;
}
