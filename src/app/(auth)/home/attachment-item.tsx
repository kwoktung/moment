"use client";

import Image from "next/image";
import { Video, File } from "lucide-react";

interface AttachmentItemProps {
  uri: string;
  index?: number;
}

const getFileType = (filename: string): "image" | "video" | "unknown" => {
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

interface ImageAttachmentProps {
  uri: string;
}

const ImageAttachment = ({ uri }: ImageAttachmentProps) => {
  const filename = uri.split("/").pop() || "Image attachment";
  return (
    <a
      href={uri}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity relative aspect-video"
    >
      <Image
        src={uri}
        alt={filename}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 25vw"
        unoptimized
      />
    </a>
  );
};

interface VideoAttachmentProps {
  uri: string;
}

const VideoAttachment = ({ uri }: VideoAttachmentProps) => {
  return (
    <a
      href={uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex rounded-lg overflow-hidden border hover:opacity-90 transition-opacity relative aspect-video bg-muted items-center justify-center group/video"
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover/video:text-foreground transition-colors">
        <Video className="size-10" />
        <span className="text-xs font-medium">Video</span>
      </div>
    </a>
  );
};

interface UnknownAttachmentProps {
  uri: string;
  filename: string;
}

const UnknownAttachment = ({ uri, filename }: UnknownAttachmentProps) => {
  return (
    <a
      href={uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
    >
      <File className="size-4 text-muted-foreground" />
      <span className="text-sm truncate flex-1">{filename}</span>
    </a>
  );
};

export const AttachmentItem = ({ uri, index = 0 }: AttachmentItemProps) => {
  const filename = uri.split("/").pop() || `Attachment ${index + 1}`;
  const fileType = getFileType(filename);

  const renderAttachment = () => {
    switch (fileType) {
      case "image":
        return <ImageAttachment uri={uri} />;
      case "video":
        return <VideoAttachment uri={uri} />;
      case "unknown":
        return <UnknownAttachment uri={uri} filename={filename} />;
      default:
        return <UnknownAttachment uri={uri} filename={filename} />;
    }
  };

  return <div className="relative group">{renderAttachment()}</div>;
};
