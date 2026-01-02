import { and, eq, or } from "drizzle-orm";
import { relationshipTable } from "./schema";
import type { DatabaseClient } from "./client";

/**
 * Gets a user's active relationship
 * @param db Database instance
 * @param userId User ID to check
 * @returns The active relationship if found, null otherwise
 */
export async function getUserActiveRelationship(
  db: DatabaseClient,
  userId: number,
) {
  const [relationship] = await db
    .select()
    .from(relationshipTable)
    .where(
      and(
        or(
          eq(relationshipTable.user1Id, userId),
          eq(relationshipTable.user2Id, userId),
        ),
        eq(relationshipTable.status, "active"),
      ),
    )
    .limit(1);

  return relationship || null;
}

/**
 * Checks if a user has an active relationship
 * @param db Database instance
 * @param userId User ID to check
 * @returns true if user has an active relationship, false otherwise
 */
export async function hasActiveRelationship(
  db: DatabaseClient,
  userId: number,
): Promise<boolean> {
  const relationship = await getUserActiveRelationship(db, userId);
  return relationship !== null;
}

/**
 * Gets the partner's user ID from a relationship
 * @param relationship The relationship object
 * @param userId The current user's ID
 * @returns The partner's user ID
 */
export function getPartnerId(
  relationship: { user1Id: number; user2Id: number },
  userId: number,
): number {
  return relationship.user1Id === userId
    ? relationship.user2Id
    : relationship.user1Id;
}
