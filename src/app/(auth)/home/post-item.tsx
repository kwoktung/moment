"use client";

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
import { ImageGrid } from "./image-grid";
import { formatTimestamp, formatFullTimestamp } from "@/lib/format/timestamp";

interface PostItemProps {
  post: Post;
  isDeleting: boolean;
  onDelete: (postId: number) => void;
  onImageClick: (attachments: Array<{ uri: string }>, index: number) => void;
}

export const PostItem = ({
  post,
  isDeleting,
  onDelete,
  onImageClick,
}: PostItemProps) => {
  return (
    <div className="group">
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
                  disabled={isDeleting}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onDelete(post.id)}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  {isDeleting ? (
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
          <p className="mt-1 whitespace-pre-wrap break-words">{post.text}</p>
          {post.attachments && post.attachments.length > 0 && (
            <ImageGrid
              attachments={post.attachments}
              onImageClick={(idx) => onImageClick(post.attachments, idx)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
