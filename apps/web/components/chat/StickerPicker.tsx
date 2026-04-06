"use client";

import { mockStickerPack } from "@/lib/mock-stickers";

type StickerPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (stickerId: string, emoji: string) => void;
};

export function StickerPicker({ open, onClose, onSelect }: StickerPickerProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-transparent"
        aria-label="Đóng sticker"
        onClick={onClose}
      />
      <div className="absolute bottom-full left-0 z-50 mb-1 max-h-52 w-[min(100%,320px)] overflow-y-auto rounded-lg border border-[var(--zalo-border)] bg-white p-2 shadow-md">
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-6">
          {mockStickerPack.map((s) => (
            <button
              key={s.id}
              type="button"
              title={s.label}
              onClick={() => {
                onSelect(s.id, s.emoji);
                onClose();
              }}
              className="flex h-12 w-12 items-center justify-center rounded-md text-2xl transition hover:bg-[var(--zalo-surface)]"
            >
              {s.emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
