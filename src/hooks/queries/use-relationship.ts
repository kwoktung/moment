import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";

export interface RelationshipInfo {
  id: number;
  partner: {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  relationshipStartDate: string | null;
  status: string;
  createdAt: string;
  permanentDeletionAt: string | null;
  resumeRequest: {
    requestedBy: number;
    requestedAt: string;
  } | null;
}

export interface RelationshipResponse {
  relationship: RelationshipInfo | null;
}

export interface UseRelationshipOptions {
  refetchInterval?: number;
}

export function useRelationship(options?: UseRelationshipOptions) {
  return useQuery({
    queryKey: ["relationship"],
    queryFn: async () => {
      const response = await apiClient.relationship.getApiRelationship();

      return response as RelationshipResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchInterval: options?.refetchInterval, // 5 seconds
  });
}

export interface InviteCodeResponse {
  inviteCode: string;
}

export function useInviteCode() {
  return useQuery({
    queryKey: ["inviteCode"],
    queryFn: async () => {
      const response =
        await apiClient.relationship.getApiRelationshipInviteCode();
      return response as InviteCodeResponse;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
  });
}
