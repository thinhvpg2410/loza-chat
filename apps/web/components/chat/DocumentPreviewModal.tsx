"use client";

import { useEffect } from "react";
import { IconClose } from "@/components/chat/icons";

type DocumentPreviewModalProps = {
  embedUrl: string | null;
  title: string;
  /** Original file URL (open in new tab / download). */
  downloadUrl: string | null;
  onClose: () => void;
};

export function DocumentPreviewModal({
  embedUrl,
  title,
  downloadUrl,
  onClose,
}: DocumentPreviewModalProps) {
  useEffect(() => {
    if (!embedUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embedUrl, onClose]);

  if (!embedUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-black/75 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Xem tài liệu"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--zalo-border)] px-3 py-2">
          <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--zalo-text)]" title={title}>
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            {downloadUrl ? (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-2 py-1.5 text-[12px] font-medium text-[var(--zalo-blue)] hover:bg-black/[0.04]"
              >
                Mở tab mới
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06]"
              title="Đóng"
            >
              <IconClose className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 bg-[var(--zalo-surface)]">
          {/* Chrome built-in PDF viewer does not run inside a sandboxed iframe (blocked page). */}
          <iframe
            title={title}
            src={embedUrl}
            className="h-full min-h-[50vh] w-full border-0"
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
