import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AttachmentService,
  generateTimestampFilename,
} from "../attachment.service";
import { createMockContext } from "@/test/helpers";
import { HTTPException } from "hono/http-exception";

describe("generateTimestampFilename", () => {
  it("should generate filename with timestamp and UUID", () => {
    const filename = generateTimestampFilename("test.jpg");

    expect(filename).toMatch(/^\d+-[a-f0-9-]+\.jpg$/);
  });

  it("should preserve file extension", () => {
    const filename = generateTimestampFilename("image.png");

    expect(filename).toMatch(/\.png$/);
  });

  it("should handle filenames without extension", () => {
    const filename = generateTimestampFilename("README");

    expect(filename).toMatch(/^\d+-[a-f0-9-]+$/);
    expect(filename).not.toContain(".");
  });

  it("should handle undefined originalFilename", () => {
    const filename = generateTimestampFilename();

    expect(filename).toMatch(/^\d+-[a-f0-9-]+$/);
    expect(filename).not.toContain(".");
  });

  it("should generate unique filenames for concurrent calls", () => {
    const filename1 = generateTimestampFilename("test.jpg");
    const filename2 = generateTimestampFilename("test.jpg");

    expect(filename1).not.toBe(filename2);
  });
});

describe("AttachmentService", () => {
  let attachmentService: AttachmentService;
  let mockCtx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockCtx = createMockContext();
    attachmentService = new AttachmentService(mockCtx);
  });

  describe("uploadAttachment", () => {
    it("should throw HTTPException if no file provided", async () => {
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attachmentService.uploadAttachment(null as any, 1),
      ).rejects.toThrow(HTTPException);

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attachmentService.uploadAttachment(null as any, 1),
      ).rejects.toThrow("No file provided");
    });

    it("should throw HTTPException if file is empty", async () => {
      const emptyFile = new File([], "empty.txt", { type: "text/plain" });

      await expect(
        attachmentService.uploadAttachment(emptyFile, 1),
      ).rejects.toThrow(HTTPException);

      await expect(
        attachmentService.uploadAttachment(emptyFile, 1),
      ).rejects.toThrow("File is empty");
    });

    it("should throw HTTPException if R2 upload fails", async () => {
      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });

      // Mock R2 put to return null (failure)
      mockCtx.env.R2.put = vi.fn().mockResolvedValue(null);

      await expect(attachmentService.uploadAttachment(file, 1)).rejects.toThrow(
        HTTPException,
      );

      await expect(attachmentService.uploadAttachment(file, 1)).rejects.toThrow(
        "Failed to upload file to storage",
      );
    });

    it("should upload file successfully and create database record", async () => {
      const userId = 1;
      const fileContent = "test content";
      const file = new File([fileContent], "test.txt", {
        type: "text/plain",
      });

      // Mock R2 put to succeed
      mockCtx.env.R2.put = vi.fn().mockResolvedValue({
        key: "mock-key",
      });

      const result = await attachmentService.uploadAttachment(file, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.filename).toMatch(/^\d+-[a-f0-9-]+\.txt$/);

      // Verify R2 was called with correct parameters
      expect(mockCtx.env.R2.put).toHaveBeenCalledWith(
        expect.stringMatching(/^\d+-[a-f0-9-]+\.txt$/),
        expect.any(ArrayBuffer),
        expect.objectContaining({
          httpMetadata: {
            contentType: "text/plain",
          },
          customMetadata: expect.objectContaining({
            originalFilename: "test.txt",
            uploadedBy: userId.toString(),
          }),
        }),
      );

      // Verify database insert was called
      expect(mockCtx.db.insert).toHaveBeenCalled();
    });

    it("should handle files without extension", async () => {
      const userId = 1;
      const file = new File(["test"], "README", { type: "text/plain" });

      mockCtx.env.R2.put = vi.fn().mockResolvedValue({
        key: "mock-key",
      });

      const result = await attachmentService.uploadAttachment(file, userId);

      expect(result.filename).toMatch(/^\d+-[a-f0-9-]+$/);
      expect(result.filename).not.toContain(".");
    });

    it("should default to application/octet-stream if no content type", async () => {
      const userId = 1;
      const file = new File(["test"], "file.bin");

      mockCtx.env.R2.put = vi.fn().mockResolvedValue({
        key: "mock-key",
      });

      await attachmentService.uploadAttachment(file, userId);

      expect(mockCtx.env.R2.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(ArrayBuffer),
        expect.objectContaining({
          httpMetadata: {
            contentType: "application/octet-stream",
          },
        }),
      );
    });
  });

  describe("getAttachment", () => {
    it("should throw HTTPException if file not found in R2", async () => {
      mockCtx.env.R2.get = vi.fn().mockResolvedValue(null);

      await expect(
        attachmentService.getAttachment("nonexistent.jpg"),
      ).rejects.toThrow(HTTPException);

      await expect(
        attachmentService.getAttachment("nonexistent.jpg"),
      ).rejects.toThrow("Attachment not found");
    });

    it("should retrieve file successfully from R2", async () => {
      const filename = "test-file.jpg";
      const mockR2Object = {
        body: new ReadableStream(),
        httpMetadata: {
          contentType: "image/jpeg",
        },
        size: 12345,
        httpEtag: "abc123",
      };

      mockCtx.env.R2.get = vi.fn().mockResolvedValue(mockR2Object);

      const result = await attachmentService.getAttachment(filename);

      expect(result).toBeDefined();
      expect(result.body).toBe(mockR2Object.body);
      expect(result.httpMetadata?.contentType).toBe("image/jpeg");
      expect(result.size).toBe(12345);
      expect(result.httpEtag).toBe("abc123");

      expect(mockCtx.env.R2.get).toHaveBeenCalledWith(filename);
    });

    it("should handle files without httpMetadata", async () => {
      const filename = "test-file.bin";
      const mockR2Object = {
        body: new ReadableStream(),
        size: 100,
        httpEtag: "xyz789",
      };

      mockCtx.env.R2.get = vi.fn().mockResolvedValue(mockR2Object);

      const result = await attachmentService.getAttachment(filename);

      expect(result).toBeDefined();
      expect(result.httpMetadata).toBeUndefined();
      expect(result.size).toBe(100);
    });
  });
});
