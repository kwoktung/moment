import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  format,
  isSameYear,
  parseISO,
  formatDistanceToNow,
} from "date-fns";

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
  const date = parseISO(dateString);
  return formatDistanceToNow(date);
};

/**
 * Formats a timestamp into a full, human-readable date and time string.
 * Used for tooltips and accessibility.
 *
 * Example: "December 27, 2025, 3:14 PM"
 */
export const formatFullTimestamp = (dateString: string): string => {
  const date = parseISO(dateString);
  return format(date, "MMMM d, yyyy, h:mm a");
};

/**
 * Formats a future timestamp as relative time until that date.
 * Used for expiration times and countdowns.
 *
 * Examples:
 * - "in 30 seconds"
 * - "in 5 minutes"
 * - "in 3 hours"
 * - "in 2 days"
 * - "in 6 days"
 * - "on Jan 7" (more than 7 days away)
 */
export const formatTimeUntil = (dateString: string): string => {
  const target = parseISO(dateString);
  const now = new Date();

  const seconds = differenceInSeconds(target, now);

  // Already expired
  if (seconds <= 0) return "expired";

  // Less than 1 minute
  if (seconds < 60) return "in less than a minute";

  // Less than 1 hour
  const minutes = differenceInMinutes(target, now);
  if (minutes < 60) {
    return `in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  // Less than 24 hours
  const hours = differenceInHours(target, now);
  if (hours < 24) {
    return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  // Less than 7 days
  const days = differenceInDays(target, now);
  if (days < 7) {
    return `in ${days} ${days === 1 ? "day" : "days"}`;
  }

  // More than 7 days: show absolute date
  const formatString = isSameYear(target, now) ? "MMM d" : "MMM d, yyyy";
  return `on ${format(target, formatString)}`;
};
