import { BaseService } from "./service";
import { invitationTable, relationshipTable } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { generateInviteCode } from "@/lib/invite-code";
import { INVITE_CODE_GENERATION_MAX_ATTEMPTS } from "@/lib/constants";
import { HTTPException } from "hono/http-exception";
import { hasActiveRelationship } from "@/database/relationship-helpers";

export interface Invitation {
  id: number;
  inviteCode: string;
  createdBy: number;
  createdAt: Date;
}

export type InvitationValidationResult =
  | {
      isValid: true;
      invitation: Invitation;
    }
  | {
      isValid: false;
      invitation: null;
      reason: string;
    };

/**
 * Invitation Service
 * Handles invitation code generation, validation, and acceptance
 */
export class InvitationService extends BaseService {
  /**
   * Generates a unique invite code with retry logic
   * Attempts up to 10 times to find a unique code
   *
   * @returns Unique invite code
   * @throws Error if unable to generate unique code after max attempts
   */
  async generateUniqueInviteCode(): Promise<string> {
    let inviteCode = generateInviteCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < INVITE_CODE_GENERATION_MAX_ATTEMPTS) {
      const [existing] = await this.ctx.db
        .select()
        .from(invitationTable)
        .where(eq(invitationTable.inviteCode, inviteCode))
        .limit(1);

      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error(
        "Failed to generate unique invite code. Please try again.",
      );
    }

    return inviteCode;
  }

  /**
   * Creates a new invitation for a user
   * Deletes any existing invitations for the user first
   *
   * @param userId - User ID creating the invitation
   * @returns Created invitation
   * @throws AlreadyInRelationshipError if user already has active relationship
   */
  async createInvitation(userId: number): Promise<Invitation> {
    // Check if user already has an active relationship
    if (await hasActiveRelationship(this.ctx.db, userId)) {
      throw new HTTPException(409, {
        message: "User is already in a relationship",
      });
    }

    // Hard delete any existing invitations for this user
    await this.ctx.db
      .delete(invitationTable)
      .where(eq(invitationTable.createdBy, userId));

    // Generate unique invite code
    const inviteCode = await this.generateUniqueInviteCode();
    const now = new Date();

    // Create invitation
    const [invitation] = await this.ctx.db
      .insert(invitationTable)
      .values({
        inviteCode,
        createdBy: userId,
        createdAt: now,
      })
      .returning();

    return invitation as Invitation;
  }

  /**
   * Gets user's invitation code, auto-creating one if none exists
   *
   * @param userId - User ID to get invitation for
   * @returns Invitation code
   */
  async getOrCreateInvitation(userId: number): Promise<string> {
    // Find user's invitation
    const [invitation] = await this.ctx.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.createdBy, userId))
      .orderBy(desc(invitationTable.createdAt))
      .limit(1);

    // Auto-create invitation if none exists
    if (!invitation) {
      const created = await this.createInvitation(userId);
      return created.inviteCode;
    }

    return invitation.inviteCode;
  }

  /**
   * Finds an invitation by code
   *
   * @param inviteCode - Invitation code to find
   * @returns Invitation if found, null otherwise
   */
  async getInvitationByCode(inviteCode: string): Promise<Invitation | null> {
    const [invitation] = await this.ctx.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.inviteCode, inviteCode))
      .limit(1);

    return invitation ? (invitation as Invitation) : null;
  }

  /**
   * Validates an invitation code and checks if it can be accepted
   *
   * @param inviteCode - Invitation code to validate
   * @param acceptingUserId - User ID trying to accept (optional, for self-acceptance check)
   * @returns Validation result with invitation and any error reason
   */
  async validateInvitation(
    inviteCode: string,
    acceptingUserId?: number,
  ): Promise<InvitationValidationResult> {
    const invitation = await this.getInvitationByCode(inviteCode);

    if (!invitation) {
      return {
        isValid: false,
        invitation: null,
        reason: "Invitation not found",
      };
    }

    // Check self-acceptance
    if (acceptingUserId && invitation.createdBy === acceptingUserId) {
      return {
        isValid: false,
        invitation: null,
        reason: "You cannot accept your own invitation",
      };
    }

    // Check if invitation creator already has an active relationship
    if (await hasActiveRelationship(this.ctx.db, invitation.createdBy)) {
      return {
        isValid: false,
        invitation: null,
        reason: "Invitation creator is already in a relationship",
      };
    }

    return {
      invitation,
      isValid: true,
    };
  }

  /**
   * Accepts an invitation and creates a relationship
   * Deletes the invitation after successful acceptance
   *
   * @param inviteCode - Invitation code to accept
   * @param acceptingUserId - User ID accepting the invitation
   * @returns Created relationship
   * @throws InvalidInvitationError if invitation is invalid
   * @throws AlreadyInRelationshipError if accepting user already has active relationship
   */
  async acceptInvitation(
    inviteCode: string,
    acceptingUserId: number,
  ): Promise<{ id: number; user1Id: number; user2Id: number }> {
    // Check if accepting user already has an active relationship
    if (await hasActiveRelationship(this.ctx.db, acceptingUserId)) {
      throw new HTTPException(409, {
        message: "User is already in a relationship",
      });
    }

    // Validate invitation
    const validation = await this.validateInvitation(
      inviteCode,
      acceptingUserId,
    );

    if (!validation.isValid) {
      throw new HTTPException(400, {
        message: `Invalid invitation: ${validation.reason}`,
      });
    }

    const invitation = validation.invitation;
    const now = new Date();

    // Create relationship and delete invitation using batch operations
    const results = await this.ctx.db.batch([
      this.ctx.db
        .insert(relationshipTable)
        .values({
          user1Id: invitation.createdBy,
          user2Id: acceptingUserId,
          status: "active",
          startDate: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      this.ctx.db
        .delete(invitationTable)
        .where(eq(invitationTable.id, invitation.id)),
    ]);

    const [relationship] = results[0] as Array<{
      id: number;
      user1Id: number;
      user2Id: number;
    }>;

    return {
      id: relationship.id,
      user1Id: relationship.user1Id,
      user2Id: relationship.user2Id,
    };
  }

  /**
   * Deletes an invitation by ID
   *
   * @param invitationId - Invitation ID to delete
   */
  async deleteInvitation(invitationId: number): Promise<void> {
    await this.ctx.db
      .delete(invitationTable)
      .where(eq(invitationTable.id, invitationId));
  }

  /**
   * Deletes all invitations for a user
   *
   * @param userId - User ID whose invitations to delete
   */
  async deleteUserInvitations(userId: number): Promise<void> {
    await this.ctx.db
      .delete(invitationTable)
      .where(eq(invitationTable.createdBy, userId));
  }
}
