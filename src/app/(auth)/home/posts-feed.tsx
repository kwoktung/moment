"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, MoreHorizontal } from "lucide-react";
import { Post } from "./types";
import { AttachmentGallery } from "./gallery";
import { ImageGrid } from "./image-grid";
import { formatTimestamp, formatFullTimestamp } from "@/lib/format/timestamp";

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
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading posts...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No posts yet. Create your first post above!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="group">
              <div className="flex gap-3">
                <Avatar className="size-9">
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
                      <span
                        className="text-muted-foreground text-sm"
                        title={formatFullTimestamp(post.createdAt)}
                      >
                        · {formatTimestamp(post.createdAt)}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                          disabled={deletingPostId === post.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onDeletePost(post.id)}
                          disabled={deletingPostId === post.id}
                          className="text-destructive focus:text-destructive"
                        >
                          {deletingPostId === post.id ? (
                            <>
                              <div className="h-4 w-4 mr-2 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words">
                    {post.text}
                  </p>
                  {post.attachments && post.attachments.length > 0 && (
                    <ImageGrid
                      attachments={post.attachments}
                      onImageClick={(idx) => openGallery(post.attachments, idx)}
                    />
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
