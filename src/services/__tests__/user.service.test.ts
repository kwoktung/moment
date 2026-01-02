import { describe, it, expect, beforeEach, vi } from "vitest";
import { UserService } from "../user.service";
import { createMockContext } from "@/test/helpers";
import { HTTPException } from "hono/http-exception";

describe("UserService", () => {
  let userService: UserService;
  let mockCtx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockCtx = createMockContext();
    userService = new UserService(mockCtx);
  });

  describe("getUserById", () => {
    it("should return null if user not found", async () => {
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await userService.getUserById(1);

      expect(result).toBeNull();
    });

    it("should return user info when user exists", async () => {
      const userId = 1;
      const mockUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: "Test User",
        avatar: "https://example.com/avatar.jpg",
      };

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await userService.getUserById(userId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(userId);
      expect(result?.email).toBe(mockUser.email);
      expect(result?.username).toBe(mockUser.username);
      expect(result?.displayName).toBe(mockUser.displayName);
      expect(result?.avatar).toBe(mockUser.avatar);
    });

    it("should handle user with null displayName and avatar", async () => {
      const userId = 1;
      const mockUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: null,
        avatar: null,
      };

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await userService.getUserById(userId);

      expect(result).not.toBeNull();
      expect(result?.displayName).toBeNull();
      expect(result?.avatar).toBeNull();
    });
  });

  describe("updateAvatar", () => {
    it("should update user avatar successfully", async () => {
      const userId = 1;
      const newAvatar = "https://example.com/new-avatar.jpg";
      const updatedUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: "Test User",
        avatar: newAvatar,
      };

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await userService.updateAvatar(userId, newAvatar);

      expect(result).toBeDefined();
      expect(result.avatar).toBe(newAvatar);
      expect(mockCtx.db.update).toHaveBeenCalled();
    });

    it("should allow setting avatar to null", async () => {
      const userId = 1;
      const updatedUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: "Test User",
        avatar: null,
      };

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await userService.updateAvatar(userId, null);

      expect(result).toBeDefined();
      expect(result.avatar).toBeNull();
    });

    it("should throw HTTPException if user not found", async () => {
      const userId = 1;

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        userService.updateAvatar(userId, "https://example.com/avatar.jpg"),
      ).rejects.toThrow(HTTPException);
    });
  });

  describe("updateProfile", () => {
    it("should update user display name successfully", async () => {
      const userId = 1;
      const newDisplayName = "New Display Name";
      const updatedUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: newDisplayName,
        avatar: "https://example.com/avatar.jpg",
      };

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await userService.updateProfile(userId, newDisplayName);

      expect(result).toBeDefined();
      expect(result.displayName).toBe(newDisplayName);
      expect(mockCtx.db.update).toHaveBeenCalled();
    });

    it("should allow setting display name to null", async () => {
      const userId = 1;
      const updatedUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: null,
        avatar: "https://example.com/avatar.jpg",
      };

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await userService.updateProfile(userId, null);

      expect(result).toBeDefined();
      expect(result.displayName).toBeNull();
    });

    it("should throw HTTPException if user not found", async () => {
      const userId = 1;

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        userService.updateProfile(userId, "New Name"),
      ).rejects.toThrow(HTTPException);
    });
  });
});
