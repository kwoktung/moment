"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, X, Edit2 } from "lucide-react";
import {
  useUpdateAvatar,
  useRemoveAvatar,
} from "@/hooks/mutations/use-user-mutations";
import { handleApiError } from "@/lib/error-handler";
import { AvatarEditor } from "./avatar-editor";
import {
  validateImageFile,
  getAvatarUrl,
  getUserInitials,
  createPreviewUrl,
  revokePreviewUrl,
  blobToFile,
} from "./avatar-utils";
import type { UserData } from "./types";

interface ProfilePictureSectionProps {
  user: UserData | null;
}

interface ProfileAvatarProps {
  displayUrl: string | null;
  initials: string;
  userName: string;
  size?: string;
}

const ProfileAvatar = ({
  displayUrl,
  initials,
  userName,
  size = "size-24",
}: ProfileAvatarProps) => {
  return (
    <Avatar className={size} key={displayUrl}>
      {displayUrl ? (
        <AvatarImage src={displayUrl} alt={userName} />
      ) : (
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      )}
    </Avatar>
  );
};

export const ProfilePictureSection = ({ user }: ProfilePictureSectionProps) => {
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [editedPreview, setEditedPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateAvatarMutation = useUpdateAvatar();
  const removeAvatarMutation = useRemoveAvatar();

  const cleanupPreviews = useCallback(() => {
    if (originalPreview) revokePreviewUrl(originalPreview);
    if (editedPreview) revokePreviewUrl(editedPreview);
    setOriginalPreview(null);
    setEditedPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [originalPreview, editedPreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    cleanupPreviews();
    const previewUrl = createPreviewUrl(file);
    setOriginalPreview(previewUrl);
    setIsEditorOpen(true);
  };

  const handleEditorSave = (croppedBlob: Blob) => {
    const croppedFile = blobToFile(croppedBlob, "avatar.jpg");
    setSelectedFile(croppedFile);

    // Clean up previous edited preview
    if (editedPreview) revokePreviewUrl(editedPreview);

    // Create new preview for the cropped image
    const newPreview = createPreviewUrl(croppedBlob);
    setEditedPreview(newPreview);
    setIsEditorOpen(false);
  };

  const handleEditorCancel = () => {
    setIsEditorOpen(false);
    cleanupPreviews();
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;

    try {
      await updateAvatarMutation.mutateAsync({ file: selectedFile });
      cleanupPreviews();
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert(handleApiError(error));
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your avatar?")) {
      return;
    }

    try {
      await removeAvatarMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to remove avatar:", error);
      alert(handleApiError(error));
    }
  };

  const handleEditAgain = () => {
    if (originalPreview) {
      setIsEditorOpen(true);
    }
  };

  const displayUrl = getAvatarUrl(user, editedPreview);

  const initials = getUserInitials(user);
  const hasEditedPreview = Boolean(editedPreview);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="relative mx-auto sm:mx-0">
              <ProfileAvatar
                displayUrl={displayUrl}
                initials={initials}
                userName={user?.displayName || user?.username || "Avatar"}
              />
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a new profile picture. Supported formats: JPG, PNG,
                  GIF, WebP. Maximum size: 5MB.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:flex-wrap">
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
                    disabled={updateAvatarMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="mr-2 size-4" />
                    {hasEditedPreview ? "Change Image" : "Upload Image"}
                  </Button>

                  {hasEditedPreview && (
                    <>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={handleEditAgain}
                        disabled={updateAvatarMutation.isPending}
                        className="w-full sm:w-auto"
                      >
                        <Edit2 className="mr-2 size-4" />
                        Edit Again
                      </Button>
                      <Button
                        type="button"
                        onClick={handleUploadAvatar}
                        disabled={updateAvatarMutation.isPending}
                        className="w-full sm:w-auto"
                      >
                        {updateAvatarMutation.isPending
                          ? "Uploading..."
                          : "Save Avatar"}
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={cleanupPreviews}
                        disabled={updateAvatarMutation.isPending}
                        className="w-full sm:w-auto"
                      >
                        <X className="mr-2 size-4" />
                        Cancel
                      </Button>
                    </>
                  )}

                  {user?.avatar && !hasEditedPreview && (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={removeAvatarMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      <X className="mr-2 size-4" />
                      Remove Avatar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {originalPreview && (
        <AvatarEditor
          imageSrc={originalPreview}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
          isOpen={isEditorOpen}
        />
      )}
    </>
  );
};
