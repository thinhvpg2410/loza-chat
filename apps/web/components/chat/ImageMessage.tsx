"use client";

import { useState } from "react";

type ImageMessageProps = {
  imageUrl: string;
  alt?: string;
  loading?: boolean;
  isOwn: boolean;
  onOpen: () => void;
};

export function ImageMessage({ imageUrl, alt = "", loading, isOwn, onOpen }: ImageMessageProps) {
  const [loaded, setLoaded] = useState(false);
  const showSkeleton = loading || !loaded;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative block max-w-[min(100%,320px)] min-w-[120px] overflow-hidden rounded-md text-left ${
        isOwn ? "ring-1 ring-white/20" : "ring-1 ring-black/[0.08]"
      }`}
    >
      <div
        className="relative w-[240px] max-w-full sm:w-[280px]"
        style={{ aspectRatio: "4 / 3" }}
      >
        {showSkeleton ? (
          <div className="absolute inset-0 animate-pulse bg-black/[0.08]" aria-hidden />
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </button>
  );
}
