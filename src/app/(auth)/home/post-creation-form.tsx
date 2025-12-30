"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon } from "lucide-react";
import { EmojiInput } from "@/app/(auth)/home/emoji-input";
import { ImagePreviewGallery } from "@/app/(auth)/home/image-preview-gallery";
import { ImageEditorModal } from "@/app/(auth)/home/image-editor-modal";
import { useCreatePost } from "@/hooks/mutations/use-post-mutations";
import { useUploadAttachment } from "@/hooks/mutations/use-attachment-mutations";
import { handleApiError } from "@/lib/error-handler";

const MAX_CHARACTERS = 280;
const MAX_ATTACHMENTS = 4;

interface AttachmentPreview {
  file: File;
  preview?: string;
  id?: number;
  filename?: string;
  uploading?: boolean;
  editedFile?: File;
  editedPreview?: string;
  hasEdits?: boolean;
}

export const PostCreationForm = () => {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createPostMutation = useCreatePost();
  const uploadAttachmentMutation = useUploadAttachment();

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments: AttachmentPreview[] = files
      .slice(0, MAX_ATTACHMENTS - attachments.length)
      .map((file) => {
        const preview: AttachmentPreview = { file };
        if (isImageFile(file)) {
          preview.preview = URL.createObjectURL(file);
        }
        return preview;
      });

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const updated = [...prev];
      // Revoke both original and edited preview URLs
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      if (updated[index].editedPreview) {
        URL.revokeObjectURL(updated[index].editedPreview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + emoji + text.substring(end);

    setText(newText);

    // Set cursor position after the inserted emoji
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleEditSave = (editedFile: File) => {
    if (editingIndex === null) return;

    setAttachments((prev) => {
      const updated = [...prev];
      // Revoke old edited preview if exists
      if (updated[editingIndex].editedPreview) {
        URL.revokeObjectURL(updated[editingIndex].editedPreview);
      }
      updated[editingIndex] = {
        ...updated[editingIndex],
        editedFile,
        editedPreview: URL.createObjectURL(editedFile),
        hasEdits: true,
      };
      return updated;
    });
    setEditingIndex(null);
  };

  const uploadAttachment = async (
    attachment: AttachmentPreview,
  ): Promise<number> => {
    // Use edited file if exists, otherwise use original file
    const fileToUpload = attachment.editedFile || attachment.file;
    return await uploadAttachmentMutation.mutateAsync(fileToUpload as File);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length > MAX_CHARACTERS) {
      return;
    }

    setError("");

    try {
      // Upload all attachments first
      const attachmentIds: number[] = [];

      for (let i = 0; i < attachments.length; i++) {
        setAttachments((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], uploading: true };
          return updated;
        });

        try {
          const id = await uploadAttachment(attachments[i]);
          attachmentIds.push(id);

          setAttachments((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], uploading: false, id };
            return updated;
          });
        } catch (err) {
          setAttachments((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], uploading: false };
            return updated;
          });
          throw err;
        }
      }

      // Create post with attachment IDs
      await createPostMutation.mutateAsync({
        text: text.trim(),
        attachments: attachmentIds.length > 0 ? attachmentIds : undefined,
      });

      // Clear the form
      setText("");
      const oldAttachments = [...attachments];
      setAttachments([]);
      oldAttachments.forEach((att) => {
        if (att.preview) {
          URL.revokeObjectURL(att.preview);
        }
        if (att.editedPreview) {
          URL.revokeObjectURL(att.editedPreview);
        }
      });
    } catch (err) {
      setError(handleApiError(err));
      console.error("Create post error:", err);
    }
  };

  const characterCount = text.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;
  const isSubmitting =
    createPostMutation.isPending || uploadAttachmentMutation.isPending;
  const canSubmit = text.trim().length > 0 && !isOverLimit && !isSubmitting;

  return (
    <div className="border rounded-lg p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          name="text"
          ref={textareaRef}
          placeholder="What's happening?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-24 resize-none border-0 px-0 focus-visible:ring-0 shadow-none bg-transparent!"
          maxLength={MAX_CHARACTERS + 100}
        />

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <ImagePreviewGallery
            attachments={attachments}
            onEdit={setEditingIndex}
            onRemove={removeAttachment}
            disabled={isSubmitting}
          />
        )}

        <div className="flex items-center gap-2 pt-4 border-t">
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={isSubmitting || attachments.length >= MAX_ATTACHMENTS}
              className="hidden"
              id="file-input"
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />
            <label htmlFor="file-input">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting || attachments.length >= MAX_ATTACHMENTS}
                className="cursor-pointer"
                asChild
              >
                <span title="Add image">
                  <ImageIcon className="size-6" />
                </span>
              </Button>
            </label>
          </div>
          <EmojiInput
            onEmojiSelect={handleEmojiSelect}
            disabled={isSubmitting}
          />
          <div
            className={`text-sm ml-auto ${
              isOverLimit
                ? "text-destructive"
                : characterCount > MAX_CHARACTERS * 0.9
                  ? "text-yellow-500"
                  : "text-muted-foreground"
            }`}
          >
            {characterCount}/{MAX_CHARACTERS}
          </div>
          <Button type="submit" disabled={!canSubmit} className="min-w-20">
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
        {error && <div className="text-sm text-destructive">{error}</div>}
      </form>

      {/* Image Editor Modal */}
      {editingIndex !== null && attachments[editingIndex] && (
        <ImageEditorModal
          open={editingIndex !== null}
          imageUrl={
            attachments[editingIndex].preview ||
            URL.createObjectURL(attachments[editingIndex].file)
          }
          filename={attachments[editingIndex].file.name}
          onOpenChange={(open) => !open && setEditingIndex(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};
