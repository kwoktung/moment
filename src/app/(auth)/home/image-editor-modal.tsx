"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "vaul";
import { useIsMobile, useMounted } from "@/hooks";
import { ImageCropArea } from "./image-crop-area";
import { CropControls } from "./crop-controls";
import { TransformControls } from "./transform-controls";
import { createCroppedImage, type Area } from "./image-processing-utils";

interface ImageEditorModalProps {
  open: boolean;
  imageUrl: string;
  filename: string;
  onOpenChange: (open: boolean) => void;
  onSave: (editedFile: File) => void;
}

export function ImageEditorModal({
  open,
  imageUrl,
  filename,
  onOpenChange,
  onSave,
}: ImageEditorModalProps) {
  const mounted = useMounted();
  const isMobile = useIsMobile();

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  // Reset state when modal opens with new image
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setAspect(undefined);
      setCroppedAreaPixels(null);
      setProcessing(false);
    }
  }, [open, imageUrl]);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlipH = () => {
    setFlipH((prev) => !prev);
  };

  const handleFlipV = () => {
    setFlipV((prev) => !prev);
  };

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      const editedFile = await createCroppedImage(
        imageUrl,
        croppedAreaPixels,
        rotation,
        flipH,
        flipV,
        filename,
      );
      onSave(editedFile);
      onOpenChange(false);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setProcessing(false);
    }
  }, [
    croppedAreaPixels,
    imageUrl,
    rotation,
    flipH,
    flipV,
    filename,
    onSave,
    onOpenChange,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if (e.key === "Enter" && !processing) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, processing, handleCancel, handleSave]);

  if (!mounted || !open) return null;

  const editorContent = (
    <div className="flex flex-col h-full">
      {/* Crop Area */}
      <div className="flex-1 relative min-h-0 bg-background">
        <ImageCropArea
          imageUrl={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controls */}
      <div className="border-t bg-background p-4 space-y-4">
        <CropControls
          aspect={aspect}
          zoom={zoom}
          onAspectChange={setAspect}
          onZoomChange={setZoom}
        />
        <TransformControls
          rotation={rotation}
          flipH={flipH}
          flipV={flipV}
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          onFlipH={handleFlipH}
          onFlipV={handleFlipV}
        />
      </div>

      {/* Footer Actions */}
      <div className="border-t bg-background p-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={processing}>
          {processing ? "Processing..." : "Save"}
        </Button>
      </div>
    </div>
  );

  // Mobile: Full-screen drawer
  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-background/80 z-50" />
          <Drawer.Content className="bg-background flex flex-col fixed inset-0 z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <Drawer.Title className="text-lg font-semibold">
                Edit Image
              </Drawer.Title>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                disabled={processing}
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 flex flex-col min-h-0">{editorContent}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop: Full-screen dialog
  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-background/95 z-50 animate-in fade-in-0 duration-200 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Dialog Content */}
      <div
        className="fixed inset-0 z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Image editor"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <h2 className="text-lg font-semibold">Edit Image</h2>
          <button
            type="button"
            onClick={handleCancel}
            disabled={processing}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close editor"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">{editorContent}</div>
      </div>
    </>,
    document.body,
  );
}
