import { BaseService } from "./service";
import { relationshipTable, userTable } from "@/database/schema";
import { eq, and, or } from "drizzle-orm";
import { GRACE_PERIOD_MS, USER_BASIC_INFO_SELECT } from "@/lib/constants";
import { HTTPException } from "hono/http-exception";
import {
  getUserActiveRelationship,
  getPartnerId,
} from "@/database/relationship-helpers";

export interface BasicUserInfo {
  id: number;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

export interface ResumeRequest {
  requestedBy: number;
  requestedAt: string | null;
}

export interface RelationshipWithPartner {
  id: number;
  partner: BasicUserInfo;
  relationshipStartDate: string | null;
  status: string;
  createdAt: string;
  permanentDeletionAt: string | null;
  resumeRequest: ResumeRequest | null;
}

export interface ResumeResult {
  message: string;
  status: "pending_partner_approval" | "active";
  requestedBy?: number;
}

export interface EndResult {
  message: string;
  permanentDeletionAt: string;
}

/**
 * Relationship Service
 * Handles relationship lifecycle including retrieval, ending, resuming, and canceling
 */
export class RelationshipService extends BaseService {
  /**
   * Gets user's relationship with partner information
   *
   * @param userId - User ID to get relationship for
   * @returns Relationship with partner details, or null if no relationship
   */
  async getRelationshipWithPartner(
    userId: number,
  ): Promise<RelationshipWithPartner | null> {
    // Get user's active relationship
    const relationship = await getUserActiveRelationship(this.ctx.db, userId);

    if (!relationship) {
      return null;
    }

    // Get partner ID
    const partnerId = getPartnerId(relationship, userId);

    // Get partner info
    const [partner] = await this.ctx.db
      .select(USER_BASIC_INFO_SELECT)
      .from(userTable)
      .where(eq(userTable.id, partnerId))
      .limit(1);

    if (!partner) {
      return null;
    }

    // Calculate permanent deletion date if relationship has ended
    const permanentDeletionAt = relationship.endedAt
      ? new Date(relationship.endedAt.getTime() + GRACE_PERIOD_MS)
      : null;

    return {
      id: relationship.id,
      partner: {
        id: partner.id,
        username: partner.username,
        displayName: partner.displayName,
        avatar: partner.avatar,
      },
      relationshipStartDate: relationship.startDate?.toISOString() || null,
      status: relationship.status,
      createdAt:
        relationship.createdAt?.toISOString() || new Date().toISOString(),
      permanentDeletionAt: permanentDeletionAt?.toISOString() || null,
      resumeRequest: relationship.resumeRequestedBy
        ? {
            requestedBy: relationship.resumeRequestedBy,
            requestedAt: relationship.resumeRequestedAt?.toISOString() || null,
          }
        : null,
    };
  }

  /**
   * Ends an active relationship by setting status to pending_deletion
   * Relationship will be hard deleted after grace period (7 days)
   *
   * @param userId - User ID ending the relationship
   * @returns Permanent deletion date
   * @throws NoActiveRelationshipError if user has no active relationship
   */
  async endRelationship(userId: number): Promise<EndResult> {
    // Get user's active relationship
    const relationship = await getUserActiveRelationship(this.ctx.db, userId);

    if (!relationship) {
      throw new HTTPException(403, {
        message: "You must pair with a partner before performing this action",
      });
    }

    const now = new Date();

    // Update relationship status to pending_deletion
    await this.ctx.db
      .update(relationshipTable)
      .set({
        status: "pending_deletion",
        endedAt: now,
        updatedAt: now,
      })
      .where(eq(relationshipTable.id, relationship.id));

    // Calculate permanent deletion date (7 days from now)
    const permanentDeletionAt = new Date(now.getTime() + GRACE_PERIOD_MS);

    return {
      message:
        "Relationship ended. All posts will be permanently deleted after grace period.",
      permanentDeletionAt: permanentDeletionAt.toISOString(),
    };
  }

  /**
   * Handles relationship resume logic with three states:
   * 1. No request exists - Creates resume request
   * 2. Same user requesting again - Returns existing request status
   * 3. Partner accepting - Completes the resume
   *
   * @param userId - User ID requesting/accepting resume
   * @returns Resume result with status and message
   * @throws ServiceError if no pending_deletion relationship found
   * @throws ServiceError if grace period has expired
   */
  async resumeRelationship(userId: number): Promise<ResumeResult> {
    const now = new Date();

    // Find relationship in pending_deletion status that user is part of
    const relationships = await this.ctx.db
      .select()
      .from(relationshipTable)
      .where(
        and(
          or(
            eq(relationshipTable.user1Id, userId),
            eq(relationshipTable.user2Id, userId),
          ),
          eq(relationshipTable.status, "pending_deletion"),
        ),
      );

    if (relationships.length === 0) {
      throw new HTTPException(404, {
        message: "No relationship in pending deletion state found",
      });
    }

    const relationship = relationships[0];

    // Check if grace period has expired (7 days from endedAt)
    if (relationship.endedAt) {
      const permanentDeletionAt = new Date(
        relationship.endedAt.getTime() + GRACE_PERIOD_MS,
      );
      if (permanentDeletionAt < now) {
        throw new HTTPException(400, {
          message: "Grace period has expired. Relationship cannot be resumed.",
        });
      }
    }

    // Three-state logic:

    // State 1: No request exists yet
    if (!relationship.resumeRequestedBy) {
      await this.ctx.db
        .update(relationshipTable)
        .set({
          resumeRequestedBy: userId,
          resumeRequestedAt: now,
          updatedAt: now,
        })
        .where(eq(relationshipTable.id, relationship.id));

      return {
        message: "Resume request sent. Waiting for partner approval.",
        status: "pending_partner_approval",
        requestedBy: userId,
      };
    }

    // State 2: Same user clicking again
    if (relationship.resumeRequestedBy === userId) {
      return {
        message: "You have already requested to resume. Waiting for partner.",
        status: "pending_partner_approval",
        requestedBy: userId,
      };
    }

    // State 3: Partner accepting - complete the resume
    await this.ctx.db
      .update(relationshipTable)
      .set({
        status: "active",
        endedAt: null,
        resumeRequestedBy: null,
        resumeRequestedAt: null,
        updatedAt: now,
      })
      .where(eq(relationshipTable.id, relationship.id));

    return {
      message: "Relationship resumed successfully.",
      status: "active",
    };
  }

  /**
   * Cancels a pending resume request
   * Only the user who requested the resume can cancel it
   *
   * @param userId - User ID canceling the resume request
   * @returns Success message
   * @throws ServiceError if no pending resume request found
   * @throws ServiceError if user is not the requester
   */
  async cancelResumeRequest(userId: number): Promise<{ message: string }> {
    const now = new Date();

    // Find relationship in pending_deletion status that user is part of
    const relationships = await this.ctx.db
      .select()
      .from(relationshipTable)
      .where(
        and(
          or(
            eq(relationshipTable.user1Id, userId),
            eq(relationshipTable.user2Id, userId),
          ),
          eq(relationshipTable.status, "pending_deletion"),
        ),
      );

    if (relationships.length === 0 || !relationships[0].resumeRequestedBy) {
      throw new HTTPException(404, {
        message: "No pending resume request found",
      });
    }

    const relationship = relationships[0];

    // Only the requester can cancel
    if (relationship.resumeRequestedBy !== userId) {
      throw new HTTPException(403, {
        message: "Only the requester can cancel the resume request",
      });
    }

    // Clear the resume request
    await this.ctx.db
      .update(relationshipTable)
      .set({
        resumeRequestedBy: null,
        resumeRequestedAt: null,
        updatedAt: now,
      })
      .where(eq(relationshipTable.id, relationship.id));

    return {
      message: "Resume request cancelled successfully.",
    };
  }

  /**
   * Updates the relationship start date
   *
   * @param userId - User ID updating the start date
   * @param startDate - New start date in ISO format (YYYY-MM-DD)
   * @returns Success message with new start date
   * @throws HTTPException if no active relationship found
   * @throws HTTPException if invalid date format
   */
  async updateRelationshipStartDate(
    userId: number,
    startDate: string,
  ): Promise<{ message: string; relationshipStartDate: string }> {
    // Get user's active relationship
    const relationship = await getUserActiveRelationship(this.ctx.db, userId);

    if (!relationship) {
      throw new HTTPException(404, {
        message: "No active relationship found",
      });
    }

    // Validate and parse the date
    const parsedDate = new Date(startDate);
    if (isNaN(parsedDate.getTime())) {
      throw new HTTPException(400, {
        message: "Invalid date format. Expected ISO format (YYYY-MM-DD)",
      });
    }

    const now = new Date();

    // Update the relationship start date
    await this.ctx.db
      .update(relationshipTable)
      .set({
        startDate: parsedDate,
        updatedAt: now,
      })
      .where(eq(relationshipTable.id, relationship.id));

    return {
      message: "Relationship start date updated successfully",
      relationshipStartDate: parsedDate.toISOString(),
    };
  }
}
