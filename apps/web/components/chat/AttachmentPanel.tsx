"use client";

import { useEffect, useRef, useState } from "react";
import { IconDocument, IconImage, IconGrid, IconMic } from "@/components/chat/icons";

export type AttachmentAction = "image" | "file" | "sticker" | "voice";

type AttachmentPanelProps = {
  open: boolean;
  onClose: () => void;
  onPick: (action: AttachmentAction) => void;
};

const items: { action: AttachmentAction; label: string; icon: typeof IconImage }[] = [
  { action: "image", label: "Ảnh", icon: IconImage },
  { action: "file", label: "Tệp", icon: IconDocument },
  { action: "voice", label: "Ghi âm", icon: IconMic },
  { action: "sticker", label: "Sticker", icon: IconGrid },
];

export function AttachmentPanel({ open, onClose, onPick }: AttachmentPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    queueMicrotask(() => itemRefs.current[0]?.focus());
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-transparent"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div className="absolute bottom-full left-0 z-50 mb-1 w-full max-w-[280px] rounded-lg border border-[var(--zalo-border)] bg-white py-2 shadow-md">
        <div
          role="menu"
          aria-label="Tùy chọn đính kèm"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
              return;
            }
            if (e.key === "ArrowDown" || e.key === "Tab") {
              e.preventDefault();
              const next = (activeIndex + 1) % items.length;
              setActiveIndex(next);
              itemRefs.current[next]?.focus();
              return;
            }
            if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
              e.preventDefault();
              const next = (activeIndex - 1 + items.length) % items.length;
              setActiveIndex(next);
              itemRefs.current[next]?.focus();
            }
          }}
        >
        {items.map(({ action, label, icon: Icon }) => (
          <button
            key={action}
            ref={(el) => {
              itemRefs.current[items.findIndex((it) => it.action === action)] = el;
            }}
            type="button"
            role="menuitem"
            tabIndex={items.findIndex((it) => it.action === action) === activeIndex ? 0 : -1}
            onClick={() => {
              onPick(action);
              onClose();
            }}
            onFocus={() => setActiveIndex(items.findIndex((it) => it.action === action))}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)]"
          >
            <Icon className="h-5 w-5 text-[var(--zalo-text-muted)]" />
            {label}
          </button>
        ))}
        </div>
      </div>
    </>
  );
}
