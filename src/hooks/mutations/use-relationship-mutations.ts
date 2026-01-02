import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";

interface CreateInviteResponse {
  inviteCode: string;
}

interface AcceptInviteRequest {
  inviteCode: string;
}

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response =
        await apiClient.relationship.postApiRelationshipInviteCreate({});

      return response as CreateInviteResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationship"] });
      queryClient.invalidateQueries({ queryKey: ["inviteCode"] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AcceptInviteRequest) => {
      const response =
        await apiClient.relationship.postApiRelationshipInviteAccept(data);

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationship"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}

export function useEndRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.relationship.postApiRelationshipEnd();

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationship"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}

export function useResumeRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.relationship.postApiRelationshipResume();

      return response;
    },
    onSuccess: (data) => {
      // Always invalidate relationship data
      queryClient.invalidateQueries({ queryKey: ["relationship"] });

      // Only invalidate posts if relationship actually resumed (status "active")
      if (data.status === "active") {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      }
    },
  });
}

export function useCancelResumeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response =
        await apiClient.relationship.postApiRelationshipResumeCancel();

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationship"] });
    },
  });
}
