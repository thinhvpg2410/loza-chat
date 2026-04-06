"use client";

import { IconDocument, IconImage, IconGrid } from "@/components/chat/icons";

export type AttachmentAction = "image" | "file" | "sticker";

type AttachmentPanelProps = {
  open: boolean;
  onClose: () => void;
  onPick: (action: AttachmentAction) => void;
};

const items: { action: AttachmentAction; label: string; icon: typeof IconImage }[] = [
  { action: "image", label: "Ảnh", icon: IconImage },
  { action: "file", label: "Tệp", icon: IconDocument },
  { action: "sticker", label: "Sticker", icon: IconGrid },
];

export function AttachmentPanel({ open, onClose, onPick }: AttachmentPanelProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-transparent"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div className="absolute bottom-full left-0 z-50 mb-1 w-[min(100%,280px)] rounded-lg border border-[var(--zalo-border)] bg-white py-2 shadow-md">
        {items.map(({ action, label, icon: Icon }) => (
          <button
            key={action}
            type="button"
            onClick={() => {
              onPick(action);
              onClose();
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)]"
          >
            <Icon className="h-5 w-5 text-[var(--zalo-text-muted)]" />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
