"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, X } from "lucide-react";
import { apiClient } from "@/lib/client";
import { ApiError } from "@/lib/api-client";
import type { UserData } from "./types";

interface ProfilePictureSectionProps {
  user: UserData | null;
  onUserUpdate: (user: UserData) => void;
  onRefresh: () => void;
}

export const ProfilePictureSection = ({
  user,
  onUserUpdate,
  onRefresh,
}: ProfilePictureSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemovePreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Upload the file first
      const uploadResponse = await apiClient.attachment.postApiAttachment({
        file: selectedFile,
      });

      if (!uploadResponse.data?.filename) {
        throw new Error("Failed to upload image");
      }

      // Update user avatar with the filename
      const avatarUrl = `/api/attachment/${uploadResponse.data.filename}`;
      const response = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ avatar: avatarUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to update avatar");
      }

      const data = (await response.json()) as { user?: UserData };
      if (data.user) {
        onUserUpdate(data.user);
      }

      // Clean up preview
      handleRemovePreview();

      // Refresh user data
      onRefresh();
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      if (error instanceof ApiError) {
        alert(
          error.body?.error || error.body?.message || "Failed to upload avatar",
        );
      } else {
        alert("Failed to upload avatar. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your avatar?")) {
      return;
    }

    try {
      const response = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ avatar: null }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove avatar");
      }

      const data = (await response.json()) as { user?: UserData };
      if (data.user) {
        onUserUpdate(data.user);
      }
    } catch (error) {
      console.error("Failed to remove avatar:", error);
      alert("Failed to remove avatar. Please try again.");
    }
  };

  const getAvatarUrl = () => {
    if (preview) return preview;
    if (user?.avatar) {
      // If avatar is already a full URL, return it; otherwise construct the path
      return user.avatar.startsWith("http") || user.avatar.startsWith("/")
        ? user.avatar
        : `/api/attachment/${user.avatar}`;
    }
    return null;
  };

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          <div className="relative">
            <Avatar className="size-24">
              {getAvatarUrl() ? (
                <AvatarImage
                  src={getAvatarUrl() || undefined}
                  alt={user?.displayName || user?.username || "Avatar"}
                />
              ) : (
                <AvatarFallback className="text-2xl">
                  {getInitials()}
                </AvatarFallback>
              )}
            </Avatar>
            {preview && (
              <button
                onClick={handleRemovePreview}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                type="button"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a new profile picture. Supported formats: JPG, PNG, GIF,
                WebP. Maximum size: 5MB.
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-2 size-4" />
                  {preview ? "Change Image" : "Upload Image"}
                </Button>
                {user?.avatar && !preview && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                  >
                    <X className="mr-2 size-4" />
                    Remove Avatar
                  </Button>
                )}
              </div>
            </div>
            {preview && (
              <div className="space-y-2">
                <div className="relative w-full max-w-xs aspect-square rounded-lg overflow-hidden border">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleUploadAvatar} disabled={uploading}>
                    {uploading ? "Uploading..." : "Save Avatar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRemovePreview}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
