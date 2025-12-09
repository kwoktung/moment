import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// Accounts table
export const accountTable = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    oauth_token_secret: text("oauth_token_secret"),
    oauth_token: text("oauth_token"),
  },
  (table) => {
    return [index("accounts_userId_idx").on(table.userId)];
  },
);

// Sessions table
export const sessionTable = sqliteTable(
  "sessions",
  {
    id: text("id").notNull(),
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (table) => {
    return [index("sessions_userId_idx").on(table.userId)];
  },
);

// Users table
export const userTable = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  email: text("email"),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
});

// Verification tokens table
export const verificationTokenTable = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").primaryKey().notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (table) => {
    return [index("verification_tokens_identifier_idx").on(table.identifier)];
  },
);

// Book table
export const bookTable = sqliteTable(
  "books",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    author: text("author").notNull(),
    isbn: text("isbn").unique(),
    description: text("description"),
    publishedYear: integer("published_year"),
    genre: text("genre"),
    pages: integer("pages"),
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
      index("books_title_idx").on(table.title),
      index("books_author_idx").on(table.author),
      index("books_isbn_idx").on(table.isbn),
      index("books_genre_idx").on(table.genre),
    ];
  },
);
