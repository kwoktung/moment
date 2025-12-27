"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getFileType, getFilename } from "./attachment-utils";

export interface Attachment {
  uri: string;
}

export interface AttachmentGalleryProps {
  attachments: Attachment[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GalleryImageProps {
  uri: string;
  isActive: boolean;
}

const GalleryImage = ({ uri, isActive }: GalleryImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const filename = getFilename(uri) || "Image";

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="relative max-h-[90vh] max-w-full aspect-auto">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <div className="relative h-[90vh] w-[90vw]">
          <Image
            src={uri}
            alt={filename}
            fill
            className="object-contain"
            sizes="90vw"
            priority={isActive}
            loading={isActive ? "eager" : "lazy"}
            unoptimized
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
};

interface GalleryVideoProps {
  uri: string;
  isActive: boolean;
}

const GalleryVideo = ({ uri, isActive }: GalleryVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <div className="flex items-center justify-center h-full w-full">
      <video
        ref={videoRef}
        src={uri}
        controls
        className="max-h-[90vh] max-w-full object-contain"
        preload={isActive ? "auto" : "metadata"}
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
};

interface GallerySlideProps {
  attachment: Attachment;
  isActive: boolean;
}

const GallerySlide = ({ attachment, isActive }: GallerySlideProps) => {
  const filename = getFilename(attachment.uri);
  const fileType = getFileType(filename);

  if (fileType === "image") {
    return <GalleryImage uri={attachment.uri} isActive={isActive} />;
  }

  if (fileType === "video") {
    return <GalleryVideo uri={attachment.uri} isActive={isActive} />;
  }

  return (
    <div className="flex items-center justify-center h-full w-full text-white">
      <div className="text-center">
        <p className="text-lg">Unsupported file type</p>
        <a
          href={attachment.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Open in new tab
        </a>
      </div>
    </div>
  );
};

export function AttachmentGallery({
  attachments,
  initialIndex,
  open,
  onOpenChange,
}: AttachmentGalleryProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialIndex,
    loop: false,
    skipSnaps: false,
    align: "center",
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (open && galleryRef.current) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      galleryRef.current.focus();
    } else if (!open && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          emblaApi?.scrollPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          emblaApi?.scrollNext();
          break;
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, emblaApi, handleClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/95 z-50 animate-in fade-in-0 duration-200"
        onClick={handleClose}
      />

      {/* Content */}
      <div
        ref={galleryRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Attachment gallery"
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-all duration-200"
          aria-label="Close gallery"
        >
          <X className="size-6" />
        </button>

        {/* Carousel container */}
        <div className="overflow-hidden w-full h-full" ref={emblaRef}>
          <div className="flex h-full">
            {attachments.map((attachment, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
                <GallerySlide
                  attachment={attachment}
                  isActive={index === currentIndex}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Previous button */}
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-0 text-white transition-all z-10"
          aria-label={`Previous attachment (${currentIndex + 1} of ${
            attachments.length
          })`}
        >
          <ChevronLeft className="size-8" />
        </button>

        {/* Next button */}
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-0 text-white transition-all z-10"
          aria-label={`Next attachment (${currentIndex + 1} of ${
            attachments.length
          })`}
        >
          <ChevronRight className="size-8" />
        </button>

        {/* Position indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
          <span aria-live="polite">
            {currentIndex + 1} / {attachments.length}
          </span>
        </div>

        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          Now viewing {getFileType(getFilename(attachments[currentIndex].uri))}{" "}
          {currentIndex + 1} of {attachments.length}
        </div>
      </div>
    </>,
    document.body,
  );
}
