import { cookies } from "next/headers";
import { verifyJWT, JWTPayload } from "../auth/jwt";
import { SESSION_COOKIE_NAME } from "@/config/config";

export async function getSession(secret: string): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionToken) {
    return null;
  }

  return verifyJWT(sessionToken.value, secret);
}
