"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/client";

const DeleteAccountProcess = () => {
  const router = useRouter();
  const [stage, setStage] = useState<
    "attachments" | "posts" | "account" | "complete"
  >("attachments");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processAccountDeletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processAccountDeletion = async () => {
    try {
      // Stage 1: Delete attachments
      setStage("attachments");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Stage 2: Delete posts
      setStage("posts");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Stage 3: Delete account (actual API call)
      setStage("account");
      await Promise.all([
        apiClient.auth.deleteApiAuthAccount(),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      // Stage 4: Complete
      setStage("complete");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to home page
      router.push("/");
    } catch (err) {
      console.error("Delete account error:", err);
      setError("Failed to delete account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        {/* Static Icon Container */}
        <div className="relative inline-block mb-8">
          <div className="flex items-center justify-center w-32 h-32 rounded-full bg-destructive/10">
            <Trash2 className="w-12 h-12 text-destructive" />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Text content with fade transitions */}
        <div className="space-y-4">
          <h1
            className={`text-2xl font-bold transition-all duration-500 ${
              stage === "complete"
                ? "opacity-0 -translate-y-2"
                : "opacity-100 translate-y-0"
            }`}
          >
            {stage === "attachments" && "Deleting your attachments..."}
            {stage === "posts" && "Deleting your posts..."}
            {stage === "account" && "Deleting your account..."}
            {stage === "complete" && "Account deleted"}
          </h1>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2
              className={`w-4 h-4 animate-spin transition-opacity duration-300 ${
                stage === "complete" ? "opacity-0" : "opacity-100"
              }`}
            />
            <p
              className={`text-sm transition-all duration-500 ${
                stage === "complete" ? "opacity-0" : "opacity-100"
              }`}
            >
              {stage === "attachments" &&
                "Removing all your files and media..."}
              {stage === "posts" && "Removing all your posts and content..."}
              {stage === "account" && "Removing your profile information..."}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                stage === "attachments"
                  ? "bg-destructive scale-125"
                  : "bg-destructive/30 scale-100"
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                stage === "posts"
                  ? "bg-destructive scale-125"
                  : stage === "attachments"
                    ? "bg-muted-foreground/30 scale-100"
                    : "bg-destructive/30 scale-100"
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                stage === "account"
                  ? "bg-destructive scale-125"
                  : stage === "attachments" || stage === "posts"
                    ? "bg-muted-foreground/30 scale-100"
                    : "bg-destructive/30 scale-100"
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                stage === "complete"
                  ? "bg-destructive scale-125"
                  : "bg-muted-foreground/30 scale-100"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountProcess;
