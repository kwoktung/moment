"use client";

import Cropper from "react-easy-crop";
import type { Area } from "./image-processing-utils";

interface ImageCropAreaProps {
  imageUrl: string;
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  aspect?: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
}

export function ImageCropArea({
  imageUrl,
  crop,
  zoom,
  rotation,
  aspect,
  onCropChange,
  onZoomChange,
  onCropComplete,
}: ImageCropAreaProps) {
  return (
    <div className="relative w-full h-full">
      <Cropper
        image={imageUrl}
        crop={crop}
        zoom={zoom}
        rotation={rotation}
        aspect={aspect}
        onCropChange={onCropChange}
        onZoomChange={onZoomChange}
        onCropComplete={onCropComplete}
        style={{
          containerStyle: {
            background: "hsl(var(--background))",
          },
          cropAreaStyle: {
            color: "hsl(var(--primary))",
            border: "2px solid hsl(var(--primary))",
          },
          mediaStyle: {
            transform: `scaleX(1) scaleY(1)`,
          },
        }}
      />
    </div>
  );
}
