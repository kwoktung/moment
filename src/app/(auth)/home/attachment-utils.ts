export type FileType = "image" | "video" | "unknown";

export const getFileType = (filename: string): FileType => {
  const lowerFilename = filename.toLowerCase();

  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
  const videoExtensions = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv|m4v)$/i;

  if (imageExtensions.test(lowerFilename)) {
    return "image";
  }
  if (videoExtensions.test(lowerFilename)) {
    return "video";
  }
  return "unknown";
};

export const getFilename = (uri: string): string => {
  return uri.split("/").pop() || "";
};
