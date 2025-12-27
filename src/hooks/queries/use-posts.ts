import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";
import { queryKeys } from "@/lib/query-keys";
import { User } from "./use-auth";

export type Post = {
  id: number;
  text: string;
  createdBy: number;
  user: User | null;
  createdAt: string;
  updatedAt: string | null;
  attachments: Array<{
    uri: string;
  }>;
};

export function usePosts() {
  return useQuery({
    queryKey: queryKeys.posts.list(),
    queryFn: async () => {
      const data = await apiClient.post.getApiPosts();
      return data.posts || [];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
