"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";
import { formatRelative } from "date-fns";
import { Post } from "./types";
import { AttachmentItem } from "./attachment-item";
import { AttachmentGallery } from "./gallery";

interface PostsFeedProps {
  posts: Post[];
  loading: boolean;
  deletingPostId: number | null;
  onDeletePost: (postId: number) => void;
}

const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  return formatRelative(date, now);
};

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
      <h2 className="text-lg font-semibold mb-4">Posts</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading posts...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No posts yet. Create your first post above!
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="group">
              <div className="flex gap-3">
                <Avatar className="size-10">
                  {post.user?.avatar && (
                    <AvatarImage
                      src={post.user.avatar}
                      alt={post.user.displayName || post.user.username}
                    />
                  )}
                  <AvatarFallback>
                    {post.user
                      ? (post.user.displayName || post.user.username)
                          .slice(0, 2)
                          .toUpperCase()
                      : post.createdBy.toString().slice(-2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {post.user
                          ? post.user.displayName || post.user.username
                          : `User ${post.createdBy}`}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        · {formatTimestamp(post.createdAt)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeletePost(post.id)}
                      disabled={deletingPostId === post.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingPostId === post.id ? (
                        <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words">
                    {post.text}
                  </p>
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {post.attachments.map((attachment, idx) => (
                        <AttachmentItem
                          key={idx}
                          uri={attachment.uri}
                          index={idx}
                          onClick={() => openGallery(post.attachments, idx)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
