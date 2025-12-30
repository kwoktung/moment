import type { UserData } from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates if a file is an acceptable image for avatar upload
 */
export function validateImageFile(file: File): ValidationResult {
  if (!file.type.startsWith("image/")) {
    return {
      isValid: false,
      error: "Please select an image file",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: "Image size must be less than 5MB",
    };
  }

  return { isValid: true };
}

/**
 * Gets the avatar URL with proper fallback handling
 */
export function getAvatarUrl(
  user: UserData | null,
  previewUrl?: string | null,
): string | null {
  if (previewUrl) {
    return previewUrl;
  }

  if (user?.avatar) {
    // If avatar is already a full URL, return it; otherwise construct the path
    return user.avatar.startsWith("http") || user.avatar.startsWith("/")
      ? user.avatar
      : `/api/attachment/${user.avatar}`;
  }

  return null;
}

/**
 * Gets user initials for avatar fallback
 */
export function getUserInitials(user: UserData | null): string {
  if (user?.displayName) {
    return user.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (user?.username) {
    return user.username.slice(0, 2).toUpperCase();
  }

  return "U";
}

/**
 * Creates an object URL from a Blob and tracks it for cleanup
 */
export function createPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revokes an object URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Converts a Blob to a File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}
