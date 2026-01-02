import { describe, it, expect, beforeEach, vi } from "vitest";
import { PostService } from "../post.service";
import { createMockContext } from "@/test/helpers";
import { HTTPException } from "hono/http-exception";

describe("PostService", () => {
  let postService: PostService;
  let mockCtx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockCtx = createMockContext();
    postService = new PostService(mockCtx);
  });

  describe("createPost", () => {
    it("should throw HTTPException if user has no relationship", async () => {
      // Mock no active relationship
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(postService.createPost(1, "Test post")).rejects.toThrow(
        HTTPException,
      );
    });

    it("should throw HTTPException if attachments don't exist", async () => {
      const userId = 1;
      const attachmentIds = [1, 2, 3];

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          where: vi.fn().mockImplementation((_condition) => {
            selectCallCount++;
            if (selectCallCount === 1) {
              // Return active relationship
              return {
                limit: vi.fn().mockResolvedValue([
                  {
                    id: 1,
                    user1Id: userId,
                    user2Id: 2,
                    status: "active",
                  },
                ]),
              };
            }
            // Return only 2 attachments (missing 1)
            return vi.fn().mockResolvedValue([
              { id: 1, filename: "file1.jpg" },
              { id: 2, filename: "file2.jpg" },
            ])();
          }),
        }),
      });

      await expect(
        postService.createPost(userId, "Test post", attachmentIds),
      ).rejects.toThrow(HTTPException);
    });

    it("should create post successfully without attachments", async () => {
      const userId = 1;
      const text = "Test post";

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // First select: getUserActiveRelationship
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    id: 1,
                    user1Id: userId,
                    user2Id: 2,
                    status: "active",
                  },
                ]),
              }),
            }),
          };
        }
        if (selectCallCount === 2) {
          // Second select: fetch attachments for post (empty)
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
          };
        }
        // Third select: fetch post with user
        return {
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    post: {
                      id: 1,
                      text,
                      createdBy: userId,
                      relationshipId: 1,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                    user: {
                      id: userId,
                      username: "testuser",
                      displayName: "Test User",
                      avatar: null,
                    },
                  },
                ]),
              }),
            }),
          }),
        };
      });

      const result = await postService.createPost(userId, text);

      expect(result).toBeDefined();
      expect(result.text).toBe(text);
      expect(result.createdBy).toBe(userId);
      expect(result.attachments).toHaveLength(0);
      expect(mockCtx.db.insert).toHaveBeenCalled();
    });

    it("should create post successfully with attachments", async () => {
      const userId = 1;
      const text = "Test post";
      const attachmentIds = [1, 2];

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // First select: getUserActiveRelationship
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    id: 1,
                    user1Id: userId,
                    user2Id: 2,
                    status: "active",
                  },
                ]),
              }),
            }),
          };
        }
        if (selectCallCount === 2) {
          // Second select: validate attachments exist
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                { id: 1, filename: "file1.jpg" },
                { id: 2, filename: "file2.jpg" },
              ]),
            }),
          };
        }
        if (selectCallCount === 3) {
          // Third select: fetch attachments for post
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                {
                  id: 1,
                  filename: "file1.jpg",
                  postId: 1,
                  createdAt: new Date(),
                },
                {
                  id: 2,
                  filename: "file2.jpg",
                  postId: 1,
                  createdAt: new Date(),
                },
              ]),
            }),
          };
        }
        // Fourth select: fetch post with user
        return {
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    post: {
                      id: 1,
                      text,
                      createdBy: userId,
                      relationshipId: 1,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                    user: {
                      id: userId,
                      username: "testuser",
                      displayName: "Test User",
                      avatar: null,
                    },
                  },
                ]),
              }),
            }),
          }),
        };
      });

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      });

      const result = await postService.createPost(userId, text, attachmentIds);

      expect(result).toBeDefined();
      expect(result.attachments).toHaveLength(2);
      expect(mockCtx.db.update).toHaveBeenCalled(); // Attachments linked
    });
  });

  describe("getRelationshipPosts", () => {
    it("should return empty array if user has no relationship", async () => {
      // Mock no active relationship
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await postService.getRelationshipPosts(1);

      expect(result).toEqual([]);
    });

    it("should return posts with attachments for relationship", async () => {
      const userId = 1;
      const relationshipId = 1;

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                {
                  post: {
                    id: 1,
                    text: "Post 1",
                    createdBy: userId,
                    relationshipId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  user: {
                    id: userId,
                    username: "testuser",
                    displayName: "Test User",
                    avatar: null,
                  },
                },
                {
                  post: {
                    id: 2,
                    text: "Post 2",
                    createdBy: 2,
                    relationshipId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  user: {
                    id: 2,
                    username: "partner",
                    displayName: "Partner",
                    avatar: null,
                  },
                },
              ]),
            }),
          }),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          where: vi.fn().mockImplementation((_condition) => {
            selectCallCount++;
            if (selectCallCount === 1) {
              // Return active relationship
              return {
                limit: vi.fn().mockResolvedValue([
                  {
                    id: relationshipId,
                    user1Id: userId,
                    user2Id: 2,
                    status: "active",
                  },
                ]),
              };
            }
            // Return attachments
            return vi.fn().mockResolvedValue([
              { id: 1, filename: "file1.jpg", postId: 1 },
              { id: 2, filename: "file2.jpg", postId: 2 },
            ])();
          }),
        }),
      });

      const result = await postService.getRelationshipPosts(userId);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe("Post 1");
      expect(result[0].attachments).toHaveLength(1);
      expect(result[0].attachments[0].uri).toBe("/attachment/file1.jpg");
    });

    it("should handle posts with no attachments", async () => {
      const userId = 1;

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                {
                  post: {
                    id: 1,
                    text: "Post without attachments",
                    createdBy: userId,
                    relationshipId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  user: {
                    id: userId,
                    username: "testuser",
                    displayName: null,
                    avatar: null,
                  },
                },
              ]),
            }),
          }),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          where: vi.fn().mockImplementation((_condition) => {
            selectCallCount++;
            if (selectCallCount === 1) {
              // Return active relationship
              return {
                limit: vi.fn().mockResolvedValue([
                  {
                    id: 1,
                    user1Id: userId,
                    user2Id: 2,
                    status: "active",
                  },
                ]),
              };
            }
            // Return no attachments
            return vi.fn().mockResolvedValue([])();
          }),
        }),
      });

      const result = await postService.getRelationshipPosts(userId);

      expect(result).toHaveLength(1);
      expect(result[0].attachments).toHaveLength(0);
    });
  });

  describe("deletePost", () => {
    it("should throw HTTPException if post doesn't exist", async () => {
      // Mock no active relationship and no post
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(postService.deletePost(1, 999)).rejects.toThrow(
        HTTPException,
      );
    });

    it("should throw HTTPException if user doesn't own the post", async () => {
      const userId = 1;
      const postId = 1;
      const ownerId = 2;

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
                    user2Id: ownerId,
                    status: "active",
                  },
                ];
              }
              // Return post owned by other user
              return [
                {
                  id: postId,
                  text: "Post",
                  createdBy: ownerId,
                  relationshipId: 1,
                },
              ];
            }),
          }),
        }),
      });

      await expect(postService.deletePost(userId, postId)).rejects.toThrow(
        HTTPException,
      );
    });

    it("should throw HTTPException if post belongs to different relationship", async () => {
      const userId = 1;
      const postId = 1;

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
                    user2Id: 2,
                    status: "active",
                  },
                ];
              }
              // Return post from different relationship
              return [
                {
                  id: postId,
                  text: "Post",
                  createdBy: userId,
                  relationshipId: 999, // Different relationship
                },
              ];
            }),
          }),
        }),
      });

      await expect(postService.deletePost(userId, postId)).rejects.toThrow(
        HTTPException,
      );
    });

    it("should delete post successfully", async () => {
      const userId = 1;
      const postId = 1;

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
                    user2Id: 2,
                    status: "active",
                  },
                ];
              }
              // Return post owned by user in same relationship
              return [
                {
                  id: postId,
                  text: "Post",
                  createdBy: userId,
                  relationshipId: 1,
                },
              ];
            }),
          }),
        }),
      });

      await postService.deletePost(userId, postId);

      expect(mockCtx.db.delete).toHaveBeenCalled();
    });

    it("should allow deletion when user has no current relationship but owns the post", async () => {
      const userId = 1;
      const postId = 1;

      let selectCallCount = 0;
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(async () => {
              selectCallCount++;
              if (selectCallCount === 1) {
                // No active relationship
                return [];
              }
              // Return post owned by user
              return [
                {
                  id: postId,
                  text: "Post",
                  createdBy: userId,
                  relationshipId: 1, // Old relationship
                },
              ];
            }),
          }),
        }),
      });

      await postService.deletePost(userId, postId);

      expect(mockCtx.db.delete).toHaveBeenCalled();
    });
  });
});
