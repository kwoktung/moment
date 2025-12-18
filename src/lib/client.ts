import { ApiClient } from "./api-client";

// Create a singleton API client instance for client-side use
// Uses relative URLs so it works with Next.js API routes
export const apiClient = new ApiClient({
  BASE: "", // Use relative URLs for Next.js API routes
  WITH_CREDENTIALS: true,
  CREDENTIALS: "include", // Include cookies for authentication
});
