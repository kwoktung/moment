import { BaseService } from "./service";
import { userTable } from "@/database/schema";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

export interface UserInfo {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

/**
 * User Service
 * Handles user CRUD operations
 */
export class UserService extends BaseService {
  /**
   * Gets user information by user ID
   *
   * @param userId - User ID to retrieve
   * @returns User information or null if not found
   */
  async getUserById(userId: number): Promise<UserInfo | null> {
    const [user] = await this.ctx.db
      .select({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    };
  }

  /**
   * Updates user avatar
   *
   * @param userId - User ID to update
   * @param avatarUrl - New avatar URL (can be null to remove avatar)
   * @returns Updated user information
   * @throws NotFoundError if user not found
   */
  async updateAvatar(
    userId: number,
    avatarUrl: string | null,
  ): Promise<UserInfo> {
    const now = new Date();

    const [updatedUser] = await this.ctx.db
      .update(userTable)
      .set({
        avatar: avatarUrl,
        updatedAt: now,
      })
      .where(eq(userTable.id, userId))
      .returning({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      });

    if (!updatedUser) {
      throw new HTTPException(404, { message: "User not found" });
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatar: updatedUser.avatar,
    };
  }

  /**
   * Updates user profile information (display name)
   * Can be extended to update other profile fields as needed
   *
   * @param userId - User ID to update
   * @param displayName - New display name
   * @returns Updated user information
   * @throws NotFoundError if user not found
   */
  async updateProfile(
    userId: number,
    displayName: string | null,
  ): Promise<UserInfo> {
    const now = new Date();

    const [updatedUser] = await this.ctx.db
      .update(userTable)
      .set({
        displayName,
        updatedAt: now,
      })
      .where(eq(userTable.id, userId))
      .returning({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      });

    if (!updatedUser) {
      throw new HTTPException(404, { message: "User not found" });
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatar: updatedUser.avatar,
    };
  }
}
