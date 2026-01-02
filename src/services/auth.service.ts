import { BaseService } from "./service";
import { createAccessToken, createRefreshToken } from "@/lib/auth/jwt";
import { hashToken } from "@/lib/auth/token-hash";
import { verifyPassword } from "@/lib/auth/password";
import { refreshTokenTable, userTable } from "@/database/schema";
import { eq, and, gt, or } from "drizzle-orm";
import { REFRESH_TOKEN_EXPIRY_MS } from "@/lib/constants";
import { HTTPException } from "hono/http-exception";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserCredentials {
  id: number;
  email: string;
  username: string;
}

/**
 * Authentication Service
 * Handles token lifecycle, credential validation, and session management
 */
export class AuthService extends BaseService {
  /**
   * Creates access and refresh tokens for a user
   * Stores refresh token hash in database with 7-day expiration
   *
   * @param userId - User ID to create tokens for
   * @returns Token pair (access + refresh)
   */
  async createAuthTokens(userId: number): Promise<TokenPair> {
    const jwtSecret = this.ctx.env.JWT_SECRET;

    // Create access token (15 min)
    const accessToken = await createAccessToken({ userId }, jwtSecret);

    // Create refresh token (7 days)
    const refreshToken = await createRefreshToken({ userId }, jwtSecret);

    // Store refresh token hash in database
    const tokenHash = await hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.ctx.db.insert(refreshTokenTable).values({
      userId,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Validates user credentials (email or username + password)
   *
   * @param login - User email or username
   * @param password - Plain text password
   * @returns User credentials if valid, throws InvalidCredentialsError if not
   */
  async validateCredentials(
    login: string,
    password: string,
  ): Promise<UserCredentials> {
    const [user] = await this.ctx.db
      .select({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        password: userTable.password,
      })
      .from(userTable)
      .where(or(eq(userTable.email, login), eq(userTable.username, login)))
      .limit(1);

    if (!user) {
      throw new HTTPException(401, { message: "Invalid email or password" });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new HTTPException(401, { message: "Invalid email or password" });
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  /**
   * Rotates refresh token: validates old token and issues new token pair
   *
   * @param refreshToken - Current refresh token
   * @returns New token pair if valid, null if token is invalid/expired
   */
  async refreshAuthTokens(refreshToken: string): Promise<TokenPair | null> {
    const tokenHash = await hashToken(refreshToken);

    // Find token in database
    const [storedToken] = await this.ctx.db
      .select()
      .from(refreshTokenTable)
      .where(
        and(
          eq(refreshTokenTable.tokenHash, tokenHash),
          gt(refreshTokenTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!storedToken) return null;

    // Delete old token (token rotation)
    await this.ctx.db
      .delete(refreshTokenTable)
      .where(eq(refreshTokenTable.id, storedToken.id));

    // Create new token pair
    return this.createAuthTokens(storedToken.userId);
  }

  /**
   * Revokes a specific refresh token (sign out)
   *
   * @param refreshToken - Token to revoke
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = await hashToken(refreshToken);

    await this.ctx.db
      .delete(refreshTokenTable)
      .where(eq(refreshTokenTable.tokenHash, tokenHash));
  }

  /**
   * Revokes all refresh tokens for a user (sign out all devices)
   *
   * @param userId - User ID to revoke all tokens for
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.ctx.db
      .delete(refreshTokenTable)
      .where(eq(refreshTokenTable.userId, userId));
  }
}
