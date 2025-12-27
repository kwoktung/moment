"use client";

import Image from "next/image";
import { Video, File } from "lucide-react";
import { getFileType, getFilename } from "./attachment-utils";

interface AttachmentItemProps {
  uri: string;
  index?: number;
  onClick?: () => void;
}

interface ImageAttachmentProps {
  uri: string;
  onClick?: () => void;
}

const ImageAttachment = ({ uri, onClick }: ImageAttachmentProps) => {
  const filename = getFilename(uri) || "Image attachment";

  const imageElement = (
    <Image
      src={uri}
      alt={filename}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 50vw, 25vw"
      unoptimized
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity relative aspect-video w-full"
      >
        {imageElement}
      </button>
    );
  }

  return (
    <a
      href={uri}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity relative aspect-video"
    >
      {imageElement}
    </a>
  );
};

interface VideoAttachmentProps {
  uri: string;
  onClick?: () => void;
}

const VideoAttachment = ({ uri, onClick }: VideoAttachmentProps) => {
  const content = (
    <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover/video:text-foreground transition-colors">
      <Video className="size-10" />
      <span className="text-xs font-medium">Video</span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex rounded-lg overflow-hidden border hover:opacity-90 transition-opacity relative aspect-video bg-muted items-center justify-center group/video w-full"
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex rounded-lg overflow-hidden border hover:opacity-90 transition-opacity relative aspect-video bg-muted items-center justify-center group/video"
    >
      {content}
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

export const AttachmentItem = ({
  uri,
  index = 0,
  onClick,
}: AttachmentItemProps) => {
  const filename = getFilename(uri) || `Attachment ${index + 1}`;
  const fileType = getFileType(filename);

  const renderAttachment = () => {
    switch (fileType) {
      case "image":
        return <ImageAttachment uri={uri} onClick={onClick} />;
      case "video":
        return <VideoAttachment uri={uri} onClick={onClick} />;
      case "unknown":
        return <UnknownAttachment uri={uri} filename={filename} />;
      default:
        return <UnknownAttachment uri={uri} filename={filename} />;
    }
  };

  return <div className="relative group">{renderAttachment()}</div>;
};
