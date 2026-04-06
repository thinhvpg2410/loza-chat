"use client";

import { useMemo, useState } from "react";
import { IconSearch } from "@/components/chat/icons";
import { emojiCategories, searchEmojis } from "@/lib/emoji-data";
import { mockStickerPack } from "@/lib/mock-stickers";

export type EmojiStickerTab = "sticker" | "emoji";

type EmojiStickerPanelProps = {
  open: boolean;
  defaultTab?: EmojiStickerTab;
  onClose: () => void;
  onSelectSticker: (stickerId: string, emoji: string) => void;
  onInsertEmoji: (emoji: string) => void;
};

export function EmojiStickerPanel({
  open,
  defaultTab = "emoji",
  onClose,
  onSelectSticker,
  onInsertEmoji,
}: EmojiStickerPanelProps) {
  const [tab, setTab] = useState<EmojiStickerTab>(defaultTab);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [categoryId, setCategoryId] = useState(emojiCategories[0]?.id ?? "smileys");

  const searchTrim = emojiSearch.trim();
  const searchResults = useMemo(() => {
    if (!searchTrim) return [];
    return searchEmojis(searchTrim);
  }, [searchTrim]);

  const category = emojiCategories.find((c) => c.id === categoryId) ?? emojiCategories[0];
  const emojiGridItems = searchTrim ? searchResults : category?.items ?? [];

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-transparent"
        aria-label="Đóng bảng sticker và emoji"
        onClick={onClose}
      />
      <div
        className="absolute bottom-full left-0 z-50 mb-1 flex w-full max-w-[360px] flex-col overflow-hidden rounded-lg border border-[var(--zalo-border)] bg-white shadow-md"
        role="dialog"
        aria-label="Sticker và emoji"
      >
        <div className="flex shrink-0 border-b border-[var(--zalo-border)]">
          {(["sticker", "emoji"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 px-3 py-2.5 text-[12px] font-bold uppercase tracking-wide transition ${
                tab === t
                  ? "border-b-2 border-[var(--zalo-blue)] text-[var(--zalo-blue)]"
                  : "border-b-2 border-transparent text-[var(--zalo-text-muted)] hover:text-[var(--zalo-text)]"
              }`}
            >
              {t === "sticker" ? "Sticker" : "Emoji"}
            </button>
          ))}
        </div>

        {tab === "sticker" ? (
          <div className="max-h-56 overflow-y-auto p-2">
            <div className="grid grid-cols-4 gap-1 sm:grid-cols-6">
              {mockStickerPack.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  title={s.label}
                  onClick={() => {
                    onSelectSticker(s.id, s.emoji);
                    onClose();
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-md text-2xl transition hover:bg-[var(--zalo-surface)]"
                >
                  {s.emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-[var(--zalo-border)] px-2 py-1.5">
              <label className="relative flex items-center">
                <IconSearch className="pointer-events-none absolute left-2 h-4 w-4 text-[var(--zalo-text-muted)]" />
                <input
                  type="search"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Tìm emoji..."
                  className="w-full rounded-md border border-[var(--zalo-border)] bg-[var(--zalo-surface)] py-1.5 pl-8 pr-2 text-[13px] text-[var(--zalo-text)] outline-none placeholder:text-[var(--zalo-text-muted)] focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/25"
                  autoComplete="off"
                />
              </label>
            </div>
            <div className="max-h-52 overflow-y-auto p-2">
              {!searchTrim ? (
                <p className="mb-1.5 text-[11px] font-semibold text-[var(--zalo-text)]">
                  {category?.label ?? ""}
                </p>
              ) : (
                <p className="mb-1.5 text-[11px] font-semibold text-[var(--zalo-text-muted)]">
                  {searchResults.length ? "Kết quả" : "Không tìm thấy"}
                </p>
              )}
              <div className="grid grid-cols-8 gap-0.5">
                {emojiGridItems.map((item, idx) => (
                  <button
                    key={`${item.e}-${idx}`}
                    type="button"
                    title={item.t}
                    onClick={() => {
                      onInsertEmoji(item.e);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[1.25rem] leading-none transition hover:bg-[var(--zalo-surface)]"
                  >
                    {item.e}
                  </button>
                ))}
              </div>
            </div>
            {!searchTrim ? (
              <div className="flex shrink-0 gap-0.5 overflow-x-auto border-t border-[var(--zalo-border)] px-1 py-1.5">
                {emojiCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => setCategoryId(c.id)}
                    className={`flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-md text-lg transition ${
                      categoryId === c.id
                        ? "bg-[var(--zalo-blue)]/10 text-[var(--zalo-blue)]"
                        : "text-[var(--zalo-text-muted)] hover:bg-[var(--zalo-surface)]"
                    }`}
                  >
                    {c.icon}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
