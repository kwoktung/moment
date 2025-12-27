"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface CropControlsProps {
  aspect: number | undefined;
  zoom: number;
  onAspectChange: (aspect: number | undefined) => void;
  onZoomChange: (zoom: number) => void;
}

const ASPECT_RATIOS = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
];

export function CropControls({
  aspect,
  zoom,
  onAspectChange,
  onZoomChange,
}: CropControlsProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.1, 3));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.1, 1));
  };

  return (
    <div className="space-y-3">
      {/* Aspect Ratio Selection */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Aspect Ratio</label>
        <div className="flex flex-wrap gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <Button
              key={ratio.label}
              type="button"
              variant={aspect === ratio.value ? "default" : "outline"}
              size="sm"
              onClick={() => onAspectChange(ratio.value)}
              className="min-w-[60px]"
            >
              {ratio.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Zoom Control */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Zoom</label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="size-8"
          >
            <Minus className="size-4" />
          </Button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-primary
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-4
                       [&::-moz-range-thumb]:h-4
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-primary
                       [&::-moz-range-thumb]:border-0
                       [&::-moz-range-thumb]:cursor-pointer"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="size-8"
          >
            <Plus className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-10 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  );
}
