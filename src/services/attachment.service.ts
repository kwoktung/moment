import { BaseService } from "./service";
import { attachmentTable } from "@/database/schema";
import { HTTPException } from "hono/http-exception";

export interface AttachmentRecord {
  id: number;
  filename: string;
  createdAt: Date | null;
}

export interface UploadedAttachment {
  id: number;
  filename: string;
}

export interface R2Object {
  body: ReadableStream;
  httpMetadata?: {
    contentType?: string;
  };
  size: number;
  httpEtag: string;
}

/**
 * Generates a timestamp-based filename with UUID for uniqueness
 * Uses crypto.randomUUID() for concurrent-safe uniqueness
 *
 * @param originalFilename - Original filename to extract extension from
 * @returns Generated unique filename
 */
export function generateTimestampFilename(originalFilename?: string): string {
  const timestamp = Date.now();
  // Use crypto.randomUUID() for guaranteed uniqueness in concurrent scenarios
  const uuid = crypto.randomUUID();

  // Extract extension from original filename if available
  let extension = "";
  if (originalFilename) {
    const lastDot = originalFilename.lastIndexOf(".");
    if (lastDot !== -1) {
      extension = originalFilename.substring(lastDot);
    }
  }

  return `${timestamp}-${uuid}${extension}`;
}

/**
 * Attachment Service
 * Handles file upload to R2 and attachment record management
 */
export class AttachmentService extends BaseService {
  /**
   * Uploads a file to R2 storage and creates attachment record
   * Validates file exists and is not empty
   *
   * @param file - File to upload
   * @param userId - User ID uploading the file
   * @returns Uploaded attachment info
   * @throws ServiceError if file is missing or empty
   * @throws ServiceError if R2 upload fails
   */
  async uploadAttachment(
    file: File,
    userId: number,
  ): Promise<UploadedAttachment> {
    // Validate file
    if (!file) {
      throw new HTTPException(400, { message: "No file provided" });
    }
    if (file.size === 0) {
      throw new HTTPException(400, { message: "File is empty" });
    }

    // Generate timestamp-based filename for R2 storage
    const filename = generateTimestampFilename(file.name);
    const fileBuffer = await file.arrayBuffer();

    // Upload file to R2 object storage
    const r2UploadResult = await this.ctx.env.R2.put(filename, fileBuffer, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
      customMetadata: {
        originalFilename: file.name || "",
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId.toString(),
      },
    });

    if (!r2UploadResult) {
      throw new HTTPException(500, {
        message: "Failed to upload file to storage",
      });
    }

    // Save attachment record to database
    const now = new Date();
    const [attachmentRecord] = await this.ctx.db
      .insert(attachmentTable)
      .values({
        filename,
        createdAt: now,
      })
      .returning();

    return {
      id: attachmentRecord.id,
      filename,
    };
  }

  /**
   * Retrieves a file from R2 storage
   *
   * @param filename - Filename to retrieve
   * @returns R2 object with file content and metadata
   * @throws ServiceError if file not found in R2
   */
  async getAttachment(filename: string): Promise<R2Object> {
    // Fetch object from R2
    const object = await this.ctx.env.R2.get(filename);

    if (!object) {
      throw new HTTPException(404, { message: "Attachment not found" });
    }

    return {
      body: object.body as ReadableStream,
      httpMetadata: object.httpMetadata,
      size: object.size,
      httpEtag: object.httpEtag,
    };
  }
}
