import { userTable } from "@/database/schema";

// Time constants
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
export const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Invitation constants
export const INVITE_CODE_LENGTH = 8;
export const INVITE_CODE_GENERATION_MAX_ATTEMPTS = 10;

// User info selection (reusable across all routes)
export const USER_BASIC_INFO_SELECT = {
  id: userTable.id,
  username: userTable.username,
  displayName: userTable.displayName,
  avatar: userTable.avatar,
} as const;
