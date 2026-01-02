"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import Link from "next/link";
import { PostCreationForm } from "./post-creation-form";
import { PostsFeed } from "./posts-feed";
import { GracePeriodBanner } from "./grace-period-banner";
import { usePosts } from "@/hooks/queries/use-posts";
import { useRelationship } from "@/hooks/queries/use-relationship";
import { useSession } from "@/hooks/queries/use-auth";
import { useDeletePost } from "@/hooks/mutations/use-post-mutations";
import { handleApiError } from "@/lib/error-handler";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { getUserInitials } from "@/lib/format/user";

const Dashboard = () => {
  const { data: posts = [], isLoading: loading } = usePosts();
  const { data: relationshipData } = useRelationship();
  const { data: currentUser } = useSession();
  const deletePostMutation = useDeletePost();
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [ConfirmDialog, confirm] = useConfirmDialog();

  const handleDeletePost = async (postId: number) => {
    const confirmed = await confirm({
      title: "Delete Post?",
      description:
        "This will permanently delete your post. This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });

    if (!confirmed) return;

    setDeletingPostId(postId);

    try {
      await deletePostMutation.mutateAsync(postId);
    } catch (err) {
      console.error("Delete post error:", err);
      await confirm({
        title: "Error",
        description: handleApiError(err),
        confirmText: "OK",
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  const partner = relationshipData?.relationship?.partner;
  const isPendingDeletion =
    relationshipData?.relationship?.status === "pending_deletion";
  const permanentDeletionAt =
    relationshipData?.relationship?.permanentDeletionAt;

  return (
    <>
      <ConfirmDialog />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-14 w-20 items-center">
                  <Avatar className="absolute left-0 z-10 h-14 w-14 border-4 border-background shadow-md">
                    <AvatarImage src={currentUser?.avatar || undefined} />
                    <AvatarFallback className="bg-pink-400 text-white text-2xl">
                      {getUserInitials(currentUser)}
                    </AvatarFallback>
                  </Avatar>
                  {partner && (
                    <Avatar className="absolute left-8 z-0 h-14 w-14 border-4 border-background shadow-md">
                      <AvatarImage src={partner.avatar || undefined} />
                      <AvatarFallback className="bg-blue-500 text-white text-2xl">
                        {getUserInitials(partner)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="icon" title="Settings">
                  <User className="size-6" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Grace Period Banner */}
          {isPendingDeletion && permanentDeletionAt && (
            <GracePeriodBanner
              permanentDeletionAt={permanentDeletionAt}
              resumeRequest={
                relationshipData?.relationship?.resumeRequest || null
              }
              partnerName={
                partner?.displayName || partner?.username || "Your partner"
              }
            />
          )}

          {!isPendingDeletion && <PostCreationForm />}
          <Separator className="my-6" />
          <PostsFeed
            posts={posts}
            loading={loading}
            deletingPostId={deletingPostId}
            currentUserId={currentUser?.id}
            onDeletePost={handleDeletePost}
          />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
