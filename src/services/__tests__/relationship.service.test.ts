import { describe, it, expect, beforeEach, vi } from "vitest";
import { RelationshipService } from "../relationship.service";
import { createMockContext } from "@/test/helpers";
import { HTTPException } from "hono/http-exception";

describe("RelationshipService", () => {
  let relationshipService: RelationshipService;
  let mockCtx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockCtx = createMockContext();
    relationshipService = new RelationshipService(mockCtx);
  });

  describe("getRelationshipWithPartner", () => {
    it("should return null if user has no relationship", async () => {
      // Mock no active relationship
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await relationshipService.getRelationshipWithPartner(1);

      expect(result).toBeNull();
    });

    it("should return relationship with partner info when relationship exists", async () => {
      const userId = 1;
      const partnerId = 2;

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              selectCallCount++;
              if (selectCallCount === 1) {
                // Return active relationship
                return [
                  {
                    id: 1,
                    user1Id: userId,
                    user2Id: partnerId,
                    status: "active",
                    startDate: new Date("2024-01-01"),
                    createdAt: new Date("2024-01-01"),
                    endedAt: null,
                    resumeRequestedBy: null,
                    resumeRequestedAt: null,
                  },
                ];
              }
              // Return partner info
              return [
                {
                  id: partnerId,
                  username: "partner",
                  displayName: "Partner Name",
                  avatar: "https://example.com/avatar.jpg",
                },
              ];
            }),
          }),
        }),
      });

      const result =
        await relationshipService.getRelationshipWithPartner(userId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.partner.id).toBe(partnerId);
      expect(result?.partner.username).toBe("partner");
      expect(result?.status).toBe("active");
      expect(result?.permanentDeletionAt).toBeNull();
    });

    it("should calculate permanent deletion date for ended relationship", async () => {
      const userId = 1;
      const partnerId = 2;
      const endedAt = new Date("2024-01-01");

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              selectCallCount++;
              if (selectCallCount === 1) {
                // Return relationship in pending_deletion
                return [
                  {
                    id: 1,
                    user1Id: userId,
                    user2Id: partnerId,
                    status: "pending_deletion",
                    startDate: new Date("2024-01-01"),
                    createdAt: new Date("2024-01-01"),
                    endedAt,
                    resumeRequestedBy: null,
                    resumeRequestedAt: null,
                  },
                ];
              }
              // Return partner info
              return [
                {
                  id: partnerId,
                  username: "partner",
                  displayName: "Partner Name",
                  avatar: null,
                },
              ];
            }),
          }),
        }),
      });

      const result =
        await relationshipService.getRelationshipWithPartner(userId);

      expect(result).not.toBeNull();
      expect(result?.permanentDeletionAt).not.toBeNull();
      expect(result?.status).toBe("pending_deletion");
    });
  });

  describe("endRelationship", () => {
    it("should throw HTTPException if user has no active relationship", async () => {
      // Mock no active relationship
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(relationshipService.endRelationship(1)).rejects.toThrow(
        HTTPException,
      );
    });

    it("should set relationship status to pending_deletion", async () => {
      const userId = 1;

      // Mock active relationship
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                user1Id: userId,
                user2Id: 2,
                status: "active",
                startDate: new Date("2024-01-01"),
                createdAt: new Date("2024-01-01"),
                endedAt: null,
              },
            ]),
          }),
        }),
      });

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const result = await relationshipService.endRelationship(userId);

      expect(result.message).toContain("Relationship ended");
      expect(result.permanentDeletionAt).toBeDefined();
      expect(mockCtx.db.update).toHaveBeenCalled();
    });
  });

  describe("resumeRelationship", () => {
    it("should throw error if no pending_deletion relationship found", async () => {
      // Mock no pending relationship
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await expect(relationshipService.resumeRelationship(1)).rejects.toThrow(
        HTTPException,
      );
    });

    it("should throw error if grace period has expired", async () => {
      const userId = 1;
      const expiredDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              user1Id: userId,
              user2Id: 2,
              status: "pending_deletion",
              endedAt: expiredDate,
              resumeRequestedBy: null,
            },
          ]),
        }),
      });

      await expect(
        relationshipService.resumeRelationship(userId),
      ).rejects.toThrow(HTTPException);
    });

    it("should create resume request when no request exists", async () => {
      const userId = 1;

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              user1Id: userId,
              user2Id: 2,
              status: "pending_deletion",
              endedAt: new Date(Date.now() - 1000),
              resumeRequestedBy: null,
            },
          ]),
        }),
      });

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const result = await relationshipService.resumeRelationship(userId);

      expect(result.status).toBe("pending_partner_approval");
      expect(result.requestedBy).toBe(userId);
      expect(result.message).toContain("Resume request sent");
      expect(mockCtx.db.update).toHaveBeenCalled();
    });

    it("should return existing status if same user requests again", async () => {
      const userId = 1;

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              user1Id: userId,
              user2Id: 2,
              status: "pending_deletion",
              endedAt: new Date(Date.now() - 1000),
              resumeRequestedBy: userId,
            },
          ]),
        }),
      });

      const result = await relationshipService.resumeRelationship(userId);

      expect(result.status).toBe("pending_partner_approval");
      expect(result.message).toContain("already requested");
    });

    it("should complete resume when partner accepts", async () => {
      const userId = 1;
      const partnerId = 2;

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              user1Id: partnerId,
              user2Id: userId,
              status: "pending_deletion",
              endedAt: new Date(Date.now() - 1000),
              resumeRequestedBy: partnerId, // Partner requested, user is now accepting
            },
          ]),
        }),
      });

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const result = await relationshipService.resumeRelationship(userId);

      expect(result.status).toBe("active");
      expect(result.message).toContain("resumed successfully");
      expect(mockCtx.db.update).toHaveBeenCalled();
    });
  });

  describe("cancelResumeRequest", () => {
    it("should throw error if no pending resume request found", async () => {
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await expect(relationshipService.cancelResumeRequest(1)).rejects.toThrow(
        HTTPException,
      );
    });

    it("should throw error if user is not the requester", async () => {
      const userId = 1;
      const partnerId = 2;

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              user1Id: userId,
              user2Id: partnerId,
              status: "pending_deletion",
              resumeRequestedBy: partnerId, // Partner requested, not the user
            },
          ]),
        }),
      });

      await expect(
        relationshipService.cancelResumeRequest(userId),
      ).rejects.toThrow(HTTPException);
    });

    it("should cancel resume request for the requester", async () => {
      const userId = 1;

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              user1Id: userId,
              user2Id: 2,
              status: "pending_deletion",
              resumeRequestedBy: userId,
            },
          ]),
        }),
      });

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const result = await relationshipService.cancelResumeRequest(userId);

      expect(result.message).toContain("cancelled successfully");
      expect(mockCtx.db.update).toHaveBeenCalled();
    });
  });
});
