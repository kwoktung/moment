export interface User {
  displayName?: string | null;
  username: string;
}

/**
 * Get the initials from a user's display name or username
 * @param user - User object with displayName and username
 * @returns First character of displayName or username, or empty string if both are empty
 */
export const getUserInitials = (user: User | null | undefined): string => {
  if (!user) return "";
  const name = user.displayName || user.username;
  return name.slice(0, 1).toUpperCase();
};
