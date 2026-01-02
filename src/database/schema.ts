import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// Users table
export const userTable = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    displayName: text("display_name"),
    avatar: text("avatar"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
  },
  (table) => {
    return [
      index("users_email_idx").on(table.email),
      index("users_username_idx").on(table.username),
    ];
  },
);

// Attachments table
export const attachmentTable = sqliteTable(
  "attachments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    filename: text("filename").notNull(),
    postId: integer("post_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
  },
  (table) => {
    return [
      index("attachments_filename_idx").on(table.filename),
      index("attachments_post_id_idx").on(table.postId),
    ];
  },
);

// Posts table
export const postTable = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    text: text("text").notNull(),
    createdBy: integer("created_by").notNull(),
    relationshipId: integer("relationship_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
  },
  (table) => {
    return [
      index("posts_created_by_idx").on(table.createdBy),
      index("posts_created_at_idx").on(table.createdAt),
      index("posts_relationship_id_idx").on(table.relationshipId),
    ];
  },
);

// Refresh tokens table
// Note: Tokens are hard deleted on sign out
export const refreshTokenTable = sqliteTable(
  "refresh_tokens",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
  },
  (table) => {
    return [
      index("refresh_tokens_user_id_idx").on(table.userId),
      index("refresh_tokens_token_hash_idx").on(table.tokenHash),
      index("refresh_tokens_expires_at_idx").on(table.expiresAt),
    ];
  },
);

// Relationships table
export const relationshipTable = sqliteTable(
  "relationships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user1Id: integer("user1_id").notNull(),
    user2Id: integer("user2_id").notNull(),
    status: text("status").notNull(), // 'active' | 'pending_deletion'
    startDate: integer("start_date", {
      mode: "timestamp",
    }),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
    endedAt: integer("ended_at", {
      mode: "timestamp",
    }),
    resumeRequestedBy: integer("resume_requested_by"),
    resumeRequestedAt: integer("resume_requested_at", { mode: "timestamp" }),
  },
  (table) => {
    return [
      index("relationships_user1_id_idx").on(table.user1Id),
      index("relationships_user2_id_idx").on(table.user2Id),
      index("relationships_status_idx").on(table.status),
      index("relationships_ended_at_idx").on(table.endedAt),
      index("relationships_resume_requested_by_idx").on(
        table.resumeRequestedBy,
      ),
    ];
  },
);

// Invitations table
// Note: Invitations are hard deleted when accepted
// Invitations never expire - they remain valid until used or replaced
export const invitationTable = sqliteTable(
  "invitations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    inviteCode: text("invite_code").notNull().unique(),
    createdBy: integer("created_by").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
  },
  (table) => {
    return [
      index("invitations_invite_code_idx").on(table.inviteCode),
      index("invitations_created_by_idx").on(table.createdBy),
    ];
  },
);
