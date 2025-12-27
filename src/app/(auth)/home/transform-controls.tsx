"use client";

import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react";

interface TransformControlsProps {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
}

export function TransformControls({
  rotation,
  flipH,
  flipV,
  onRotateLeft,
  onRotateRight,
  onFlipH,
  onFlipV,
}: TransformControlsProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Transform</label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRotateLeft}
          className="gap-1.5"
          title="Rotate left 90°"
        >
          <RotateCcw className="size-4" />
          <span className="hidden sm:inline">Rotate Left</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRotateRight}
          className="gap-1.5"
          title="Rotate right 90°"
        >
          <RotateCw className="size-4" />
          <span className="hidden sm:inline">Rotate Right</span>
        </Button>
        <Button
          type="button"
          variant={flipH ? "secondary" : "outline"}
          size="sm"
          onClick={onFlipH}
          className="gap-1.5"
          title="Flip horizontal"
        >
          <FlipHorizontal className="size-4" />
          <span className="hidden sm:inline">Flip H</span>
        </Button>
        <Button
          type="button"
          variant={flipV ? "secondary" : "outline"}
          size="sm"
          onClick={onFlipV}
          className="gap-1.5"
          title="Flip vertical"
        >
          <FlipVertical className="size-4" />
          <span className="hidden sm:inline">Flip V</span>
        </Button>
      </div>
      {rotation !== 0 && (
        <p className="text-xs text-muted-foreground">Rotation: {rotation}°</p>
      )}
    </div>
  );
}
