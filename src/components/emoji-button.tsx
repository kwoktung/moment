"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Theme } from "emoji-picker-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface EmojiButtonProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiButton({ onEmojiSelect, disabled }: EmojiButtonProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    onEmojiSelect(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Determine emoji picker theme
  const emojiPickerTheme = mounted
    ? resolvedTheme === "dark"
      ? Theme.DARK
      : Theme.LIGHT
    : Theme.LIGHT;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        disabled={disabled}
        title="Add emoji"
      >
        <Smile className="size-4" />
      </Button>
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute top-full left-0 mb-2 z-10 emoji-picker-wrapper"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={emojiPickerTheme}
          />
        </div>
      )}
    </div>
  );
}
