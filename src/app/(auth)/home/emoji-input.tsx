"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { useTheme } from "next-themes";
import { Drawer } from "vaul";
import dynamic from "next/dynamic";

const Picker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

interface EmojiInputProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiInput({ onEmojiSelect, disabled }: EmojiInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { resolvedTheme } = useTheme();
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Check if mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !isMobile &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker && !isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker, isMobile]);

  const handleEmojiClick = (emojiData: { native: string }) => {
    onEmojiSelect(emojiData.native);
    setShowEmojiPicker(false);
  };

  const emojiPickerTheme = mounted
    ? resolvedTheme === "dark"
      ? "dark"
      : "light"
    : "light";

  // Mobile: Bottom drawer
  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowEmojiPicker(true)}
          disabled={disabled}
          title="Add emoji"
        >
          <Smile className="size-4" />
        </Button>
        <Drawer.Root open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
            <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[80vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
              <div className="p-4 bg-background rounded-t-[10px] flex-1 overflow-auto">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4" />
                <div className="flex items-center justify-between mb-4">
                  <Drawer.Title className="text-lg font-semibold">
                    Select Emoji
                  </Drawer.Title>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(false)}
                  >
                    Done
                  </Button>
                </div>
                {mounted && (
                  <Picker
                    data={async () => {
                      const response = await fetch(
                        "https://cdn.jsdelivr.net/npm/@emoji-mart/data",
                      );
                      return response.json();
                    }}
                    onEmojiSelect={handleEmojiClick}
                    theme={emojiPickerTheme}
                    previewPosition="none"
                    skinTonePosition="search"
                    perLine={8}
                    emojiSize={32}
                    emojiButtonSize={40}
                  />
                )}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </>
    );
  }

  // Desktop: Popover
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
      {showEmojiPicker && mounted && (
        <div
          ref={emojiPickerRef}
          className="absolute top-full left-0 mb-2 z-10"
        >
          <Picker
            data={async () => {
              const response = await fetch(
                "https://cdn.jsdelivr.net/npm/@emoji-mart/data",
              );
              return response.json();
            }}
            onEmojiSelect={handleEmojiClick}
            theme={emojiPickerTheme}
            previewPosition="none"
            skinTonePosition="search"
          />
        </div>
      )}
    </div>
  );
}
