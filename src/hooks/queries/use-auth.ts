import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";
import { queryKeys } from "@/lib/query-keys";

export type User = {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
};

export function useSession() {
  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: async () => {
      const response = await apiClient.user.getApiUserMe();
      return response.user as User | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - session doesn't change often
    retry: false, // Don't retry on 401
  });
}
