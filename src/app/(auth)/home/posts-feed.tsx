"use client";

import { useState } from "react";
import { Post } from "./types";
import { AttachmentGallery } from "./gallery";
import { PostItem } from "./post-item";
import { PostSkeleton } from "./post-skeleton";

interface PostsFeedProps {
  posts: Post[];
  loading: boolean;
  deletingPostId: number | null;
  onDeletePost: (postId: number) => void;
}

export const PostsFeed = ({
  posts,
  loading,
  deletingPostId,
  onDeletePost,
}: PostsFeedProps) => {
  const [galleryState, setGalleryState] = useState<{
    open: boolean;
    attachments: Array<{ uri: string }>;
    initialIndex: number;
  } | null>(null);

  const openGallery = (attachments: Array<{ uri: string }>, index: number) => {
    setGalleryState({ open: true, attachments, initialIndex: index });
  };

  const closeGallery = () => {
    setGalleryState(null);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 hidden">Posts</h2>
      {loading ? (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No posts yet. Create your first post above!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              isDeleting={deletingPostId === post.id}
              onDelete={onDeletePost}
              onImageClick={openGallery}
            />
          ))}
        </div>
      )}
      {galleryState && (
        <AttachmentGallery
          attachments={galleryState.attachments}
          initialIndex={galleryState.initialIndex}
          open={galleryState.open}
          onOpenChange={(open) => !open && closeGallery()}
        />
      )}
    </div>
  );
};
