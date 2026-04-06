"use client";

import { useEffect } from "react";
import { IconClose } from "@/components/chat/icons";

type ImagePreviewModalProps = {
  imageUrl: string | null;
  alt?: string;
  onClose: () => void;
};

export function ImagePreviewModal({ imageUrl, alt = "", onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    if (!imageUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        title="Đóng"
      >
        <IconClose className="h-6 w-6" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        className="max-h-[90vh] max-w-[95vw] rounded-md object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
