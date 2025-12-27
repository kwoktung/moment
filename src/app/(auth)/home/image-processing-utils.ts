export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates a cropped and transformed image from the source image
 * @param imageSrc - Source image URL (can be object URL)
 * @param cropArea - Pixel coordinates of the crop area
 * @param rotation - Rotation angle in degrees (0, 90, 180, 270)
 * @param flipH - Whether to flip horizontally
 * @param flipV - Whether to flip vertically
 * @param filename - Original filename for the output file
 * @returns Promise<File> - The processed image as a File object
 */
export async function createCroppedImage(
  imageSrc: string,
  cropArea: Area,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  filename: string,
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Calculate the canvas size based on rotation
  const { width, height } = getRotatedSize(
    cropArea.width,
    cropArea.height,
    rotation,
  );

  canvas.width = width;
  canvas.height = height;

  // Apply transformations
  ctx.save();

  // Translate to center of canvas
  ctx.translate(width / 2, height / 2);

  // Rotate
  ctx.rotate((rotation * Math.PI) / 180);

  // Flip
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  // Draw the cropped image centered
  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    -cropArea.width / 2,
    -cropArea.height / 2,
    cropArea.width,
    cropArea.height,
  );

  ctx.restore();

  // Convert canvas to Blob then File
  const blob = await canvasToBlob(canvas);

  // Preserve original extension or use jpg
  const extension = filename.split(".").pop()?.toLowerCase();
  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "image/jpeg";

  return new File([blob], filename, { type: mimeType });
}

/**
 * Loads an image from a URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    // Important: Set crossOrigin before src for CORS images
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

/**
 * Converts a canvas to a Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob failed"));
        }
      },
      "image/jpeg",
      0.95, // High quality JPEG
    );
  });
}

/**
 * Calculates the size of a rotated rectangle
 */
function getRotatedSize(
  width: number,
  height: number,
  rotation: number,
): { width: number; height: number } {
  const rotRad = (rotation * Math.PI) / 180;

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
