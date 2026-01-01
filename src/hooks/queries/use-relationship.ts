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

export interface ValidateInviteResponse {
  valid: boolean;
  inviter: {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
  } | null;
  expiresAt: string | null;
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

export function useValidateInvite(inviteCode: string | null) {
  return useQuery({
    queryKey: ["validateInvite", inviteCode],
    queryFn: async () => {
      if (!inviteCode) {
        return { valid: false, inviter: null, expiresAt: null };
      }

      const response =
        await apiClient.relationship.getApiRelationshipInviteValidate(
          inviteCode,
        );

      return response as ValidateInviteResponse;
    },
    enabled: !!inviteCode,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false,
  });
}

export interface PendingInviteResponse {
  invitation: {
    inviteCode: string;
    expiresAt: string;
  } | null;
}

export function usePendingInvite() {
  return useQuery({
    queryKey: ["pendingInvite"],
    queryFn: async () => {
      const response =
        await apiClient.relationship.getApiRelationshipInvitePending();
      return response as PendingInviteResponse;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
  });
}
