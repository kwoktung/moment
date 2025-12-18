"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Paperclip, Trash2 } from "lucide-react";
import { formatRelative } from "date-fns";

interface Post {
  id: number;
  text: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string | null;
  attachments: Array<{ uri: string }>;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
  } | null;
}

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
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Posts</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading posts...</div>
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No posts yet. Create your first post above!
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card
            key={post.id}
            className="hover:bg-accent/50 transition-colors relative group"
          >
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar>
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
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
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
                  <p className="text-base whitespace-pre-wrap break-words">
                    {post.text}
                  </p>
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {post.attachments.map((attachment, idx) => {
                          const filename = attachment.uri.replace(
                            "/api/attachment/",
                            "",
                          );
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                            filename,
                          );
                          const attachmentUrl = attachment.uri.startsWith("/")
                            ? attachment.uri
                            : `/api/attachment/${filename}`;

                          return (
                            <div key={idx} className="relative group">
                              {isImage ? (
                                <a
                                  href={attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity relative aspect-video"
                                >
                                  <Image
                                    src={attachmentUrl}
                                    alt={`Attachment ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                                >
                                  <Paperclip className="size-4 text-muted-foreground" />
                                  <span className="text-sm truncate flex-1">
                                    {filename}
                                  </span>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
