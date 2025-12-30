"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import Link from "next/link";
import { PostCreationForm } from "./post-creation-form";
import { PostsFeed } from "./posts-feed";
import { usePosts } from "@/hooks/queries/use-posts";
import { useDeletePost } from "@/hooks/mutations/use-post-mutations";
import { handleApiError } from "@/lib/error-handler";

const Dashboard = () => {
  const { data: posts = [], isLoading: loading } = usePosts();
  const deletePostMutation = useDeletePost();
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  const handleDeletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setDeletingPostId(postId);

    try {
      await deletePostMutation.mutateAsync(postId);
    } catch (err) {
      console.error("Delete post error:", err);
      alert(handleApiError(err));
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Moment</h1>
          <Link href="/profile">
            <Button variant="ghost" size="icon" title="Profile">
              <User className="size-6" />
            </Button>
          </Link>
        </div>
        <PostCreationForm />
        <Separator className="my-6" />
        <PostsFeed
          posts={posts}
          loading={loading}
          deletingPostId={deletingPostId}
          onDeletePost={handleDeletePost}
        />
      </div>
    </div>
  );
};

export default Dashboard;
