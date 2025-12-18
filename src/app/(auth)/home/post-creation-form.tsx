"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Paperclip, X, Image as ImageIcon } from "lucide-react";
import { apiClient } from "@/lib/client";
import { ApiError } from "@/lib/api-client";
import { EmojiButton } from "@/components/emoji-button";

const MAX_CHARACTERS = 280;
const MAX_ATTACHMENTS = 4;

interface AttachmentPreview {
  file: File;
  preview?: string;
  id?: number;
  filename?: string;
  uploading?: boolean;
}

interface PostCreationFormProps {
  onPostCreated: () => void;
}

export const PostCreationForm = ({ onPostCreated }: PostCreationFormProps) => {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
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

  const uploadAttachment = async (
    attachment: AttachmentPreview,
  ): Promise<number> => {
    try {
      const data = await apiClient.attachment.postApiAttachment({
        file: attachment.file as File,
      });
      return data.data.id;
    } catch (err) {
      if (err instanceof ApiError) {
        throw new Error(err.body?.error || "Failed to upload attachment");
      }
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.length > MAX_CHARACTERS) {
      return;
    }

    setSubmitting(true);
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
      await apiClient.post.postApiPosts({
        text: text.trim(),
        attachments: attachmentIds.length > 0 ? attachmentIds : undefined,
      });

      // Clear the form
      setText("");
      setAttachments([]);
      attachments.forEach((att) => {
        if (att.preview) {
          URL.revokeObjectURL(att.preview);
        }
      });

      // Notify parent to refresh posts
      onPostCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
      console.error("Create post error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const characterCount = text.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;
  const canSubmit = text.trim().length > 0 && !isOverLimit && !submitting;

  return (
    <Card className="mb-6">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-6">
            <Textarea
              ref={textareaRef}
              placeholder="What's happening?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-24 resize-none"
              maxLength={MAX_CHARACTERS + 100} // Allow typing past limit for visual feedback
            />

            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="relative group rounded-lg overflow-hidden border"
                    >
                      {attachment.preview ? (
                        <div className="relative aspect-video bg-muted">
                          <Image
                            src={attachment.preview}
                            alt={attachment.file.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          {attachment.uploading && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <div className="text-sm text-muted-foreground">
                                Uploading...
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-muted flex items-center gap-2">
                          <Paperclip className="size-4 text-muted-foreground" />
                          <span className="text-sm truncate flex-1">
                            {attachment.file.name}
                          </span>
                          {attachment.uploading && (
                            <div className="text-xs text-muted-foreground">
                              Uploading...
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        disabled={submitting || attachment.uploading}
                        className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  disabled={submitting || attachments.length >= MAX_ATTACHMENTS}
                  className="hidden"
                  id="file-input"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
                <label htmlFor="file-input">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={
                      submitting || attachments.length >= MAX_ATTACHMENTS
                    }
                    className="cursor-pointer"
                    asChild
                  >
                    <span title="Add image">
                      <ImageIcon className="size-4" />
                    </span>
                  </Button>
                </label>
              </div>
              <EmojiButton
                onEmojiSelect={handleEmojiSelect}
                disabled={submitting}
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
              <Button type="submit" disabled={!canSubmit} className="min-w-24">
                {submitting ? "Posting..." : "Post"}
              </Button>
            </div>
            {error && (
              <div className="text-sm text-destructive mt-2">{error}</div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
