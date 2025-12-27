/**
 * Formats a timestamp into a compact, social media-style relative time string.
 *
 * Examples:
 * - "now" (< 1 minute)
 * - "5m" (5 minutes ago)
 * - "3h" (3 hours ago)
 * - "2d" (2 days ago)
 * - "1w" (1 week ago)
 * - "Dec 18" (older than 1 month, same year)
 * - "Dec 18, 2024" (older than 1 month, different year)
 */
export const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than 1 minute
  if (seconds < 60) return "now";

  // Less than 1 hour
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;

  // Less than 24 hours
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;

  // Less than 7 days
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

  // Less than 30 days (about 1 month)
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`;

  // Older than 1 month: show absolute date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
};

/**
 * Formats a timestamp into a full, human-readable date and time string.
 * Used for tooltips and accessibility.
 *
 * Example: "December 27, 2025, 3:14 PM"
 */
export const formatFullTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
