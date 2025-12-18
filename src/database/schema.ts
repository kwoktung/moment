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
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
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
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
  },
  (table) => {
    return [
      index("posts_created_by_idx").on(table.createdBy),
      index("posts_created_at_idx").on(table.createdAt),
    ];
  },
);
