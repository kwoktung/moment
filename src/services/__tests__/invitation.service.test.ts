import { describe, it, expect, beforeEach, vi } from "vitest";
import { InvitationService } from "../invitation.service";
import { createMockContext } from "@/test/helpers";
import { HTTPException } from "hono/http-exception";

describe("InvitationService", () => {
  let invitationService: InvitationService;
  let mockCtx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockCtx = createMockContext();
    invitationService = new InvitationService(mockCtx);
  });

  describe("generateUniqueInviteCode", () => {
    it("should generate a unique invite code on first attempt", async () => {
      // Mock no existing invitation
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const inviteCode = await invitationService.generateUniqueInviteCode();

      expect(inviteCode).toBeDefined();
      expect(typeof inviteCode).toBe("string");
      expect(inviteCode.length).toBe(8);
    });

    it("should retry when code already exists", async () => {
      let attemptCount = 0;

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              attemptCount++;
              // Return existing on first attempt, empty on second
              return attemptCount === 1 ? [{ inviteCode: "EXISTING" }] : [];
            }),
          }),
        }),
      });

      const inviteCode = await invitationService.generateUniqueInviteCode();

      expect(inviteCode).toBeDefined();
      expect(attemptCount).toBe(2);
    });

    it("should throw error after max attempts", async () => {
      // Mock always returns existing invitation
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ inviteCode: "EXISTING" }]),
          }),
        }),
      });

      await expect(
        invitationService.generateUniqueInviteCode(),
      ).rejects.toThrow("Failed to generate unique invite code");
    });
  });

  describe("createInvitation", () => {
    it("should create invitation for user without active relationship", async () => {
      const userId = 1;

      // Mock no active relationship
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const invitation = await invitationService.createInvitation(userId);

      expect(invitation).toBeDefined();
      expect(invitation.inviteCode).toBeDefined();
      expect(invitation.createdBy).toBe(userId);
      expect(mockCtx.db.delete).toHaveBeenCalled(); // Should delete existing invitations
      expect(mockCtx.db.insert).toHaveBeenCalled();
    });

    it("should throw HTTPException if user has active relationship", async () => {
      const userId = 1;

      // Mock active relationship exists
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, status: "active" }]),
          }),
        }),
      });

      await expect(invitationService.createInvitation(userId)).rejects.toThrow(
        HTTPException,
      );
    });
  });

  describe("getOrCreateInvitation", () => {
    it("should return existing invitation if found", async () => {
      const userId = 1;
      const existingCode = "EXIST123";

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: 1,
                  inviteCode: existingCode,
                  createdBy: userId,
                  createdAt: new Date(),
                },
              ]),
            }),
          }),
        }),
      });

      const inviteCode = await invitationService.getOrCreateInvitation(userId);

      expect(inviteCode).toBe(existingCode);
    });

    it("should create new invitation if none exists", async () => {
      const userId = 1;

      // Mock no existing invitation, then no active relationship, then empty check for uniqueness
      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(async () => {
                selectCallCount++;
                if (selectCallCount === 1) return []; // No existing invitation
                if (selectCallCount === 2) return []; // No active relationship
                return []; // Code uniqueness check
              }),
            }),
            limit: vi.fn().mockResolvedValue([]), // For uniqueness check
          }),
        }),
      });

      const inviteCode = await invitationService.getOrCreateInvitation(userId);

      expect(inviteCode).toBeDefined();
      expect(typeof inviteCode).toBe("string");
    });
  });

  describe("getInvitationByCode", () => {
    it("should return invitation if found", async () => {
      const inviteCode = "TEST1234";

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                inviteCode,
                createdBy: 1,
                createdAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const invitation =
        await invitationService.getInvitationByCode(inviteCode);

      expect(invitation).not.toBeNull();
      expect(invitation?.inviteCode).toBe(inviteCode);
    });

    it("should return null if invitation not found", async () => {
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const invitation =
        await invitationService.getInvitationByCode("NOTFOUND");

      expect(invitation).toBeNull();
    });
  });

  describe("validateInvitation", () => {
    it("should return invalid for non-existent invitation", async () => {
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await invitationService.validateInvitation("NOTFOUND");

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.reason).toBe("Invitation not found");
      }
    });

    it("should return invalid for self-acceptance", async () => {
      const userId = 1;

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                inviteCode: "TEST1234",
                createdBy: userId,
                createdAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const result = await invitationService.validateInvitation(
        "TEST1234",
        userId,
      );

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.reason).toBe("You cannot accept your own invitation");
      }
    });

    it("should return invalid if creator has active relationship", async () => {
      const creatorId = 1;
      const acceptingUserId = 2;

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              selectCallCount++;
              if (selectCallCount === 1) {
                // Return invitation
                return [
                  {
                    id: 1,
                    inviteCode: "TEST1234",
                    createdBy: creatorId,
                    createdAt: new Date(),
                  },
                ];
              }
              // Return active relationship for creator
              return [{ id: 1, status: "active" }];
            }),
          }),
        }),
      });

      const result = await invitationService.validateInvitation(
        "TEST1234",
        acceptingUserId,
      );

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.reason).toBe(
          "Invitation creator is already in a relationship",
        );
      }
    });

    it("should return valid for valid invitation", async () => {
      const creatorId = 1;
      const acceptingUserId = 2;

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              selectCallCount++;
              if (selectCallCount === 1) {
                // Return invitation
                return [
                  {
                    id: 1,
                    inviteCode: "TEST1234",
                    createdBy: creatorId,
                    createdAt: new Date(),
                  },
                ];
              }
              // No active relationship
              return [];
            }),
          }),
        }),
      });

      const result = await invitationService.validateInvitation(
        "TEST1234",
        acceptingUserId,
      );

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.invitation).toBeDefined();
        expect(result.invitation.inviteCode).toBe("TEST1234");
      }
    });
  });

  describe("acceptInvitation", () => {
    it("should throw HTTPException if accepting user has relationship", async () => {
      const acceptingUserId = 1;

      // Mock active relationship exists
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, status: "active" }]),
          }),
        }),
      });

      await expect(
        invitationService.acceptInvitation("TEST1234", acceptingUserId),
      ).rejects.toThrow(HTTPException);
    });

    it("should throw HTTPException for invalid invitation", async () => {
      const acceptingUserId = 1;

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              selectCallCount++;
              if (selectCallCount === 1) return []; // No active relationship
              return []; // No invitation found
            }),
          }),
        }),
      });

      await expect(
        invitationService.acceptInvitation("NOTFOUND", acceptingUserId),
      ).rejects.toThrow(HTTPException);
    });
  });

  describe("deleteInvitation", () => {
    it("should delete invitation by ID", async () => {
      const invitationId = 1;

      await invitationService.deleteInvitation(invitationId);

      expect(mockCtx.db.delete).toHaveBeenCalled();
    });
  });

  describe("deleteUserInvitations", () => {
    it("should delete all invitations for a user", async () => {
      const userId = 1;

      await invitationService.deleteUserInvitations(userId);

      expect(mockCtx.db.delete).toHaveBeenCalled();
    });
  });
});
