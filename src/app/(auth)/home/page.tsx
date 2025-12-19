"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { PostCreationForm } from "./post-creation-form";
import { PostsFeed } from "./posts-feed";
import { Post } from "./types";

const Dashboard = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.post.getApiPosts();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDeletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setDeletingPostId(postId);

    try {
      await apiClient.post.deleteApiPosts(postId.toString());

      // Refresh posts after successful deletion
      await fetchPosts();
    } catch (err) {
      console.error("Delete post error:", err);
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold"></h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/profile">
              <Button variant="ghost" size="icon" title="Profile">
                <User className="size-4" />
              </Button>
            </Link>
          </div>
        </div>

        <PostCreationForm onPostCreated={fetchPosts} />

        <Separator className="mb-6" />

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
