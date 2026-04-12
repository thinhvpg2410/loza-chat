"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { AttachmentPanel, type AttachmentAction } from "@/components/chat/AttachmentPanel";
import { IconPlus, IconSend, IconSmile } from "@/components/chat/icons";
import { EmojiStickerPanel } from "@/components/chat/EmojiStickerPanel";
import { ReplyPreviewBar } from "@/components/chat/ReplyPreview";
import type { ReplyPreviewRef } from "@/lib/types/chat";

type MessageInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: ReplyPreviewRef | null;
  onCancelReply?: () => void;
  onAttachment?: (action: AttachmentAction) => void;
  onPickSticker?: (stickerId: string, emoji: string) => void;
  onInsertEmoji?: (emoji: string) => void;
  /** When false, hides file/image attach entry points (e.g. API mode until upload is wired). */
  attachmentsEnabled?: boolean;
  stickersEnabled?: boolean;
};

export function MessageInput({
  value,
  onChange,
  onSend,
  placeholder = "Nhập tin nhắn, Enter để gửi",
  disabled = false,
  replyTo,
  onCancelReply,
  onAttachment,
  onPickSticker,
  onInsertEmoji,
  attachmentsEnabled = true,
  stickersEnabled = true,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDefaultTab, setPickerDefaultTab] = useState<"sticker" | "emoji">("emoji");
  const [pickerSession, setPickerSession] = useState(0);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <footer className="relative shrink-0 border-t border-[var(--zalo-border)] bg-white">
      {replyTo && onCancelReply ? <ReplyPreviewBar replyTo={replyTo} onCancel={onCancelReply} /> : null}

      <div className="px-2 py-2">
        <div className="relative w-full min-w-0">
          <div className="flex items-end gap-0.5 rounded-xl border border-[var(--zalo-border)] bg-white px-1 py-1 focus-within:border-[var(--zalo-blue)] focus-within:ring-1 focus-within:ring-[var(--zalo-blue)]/25">
            {attachmentsEnabled ? (
              <div>
                <button
                  type="button"
                  onClick={() => setAttachOpen((v) => !v)}
                  disabled={disabled}
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--zalo-blue)] transition hover:bg-[var(--zalo-surface)] disabled:opacity-40"
                  title="Đính kèm"
                >
                  <IconPlus className="h-[22px] w-[22px]" />
                  <span className="sr-only">Đính kèm</span>
                </button>
              </div>
            ) : null}

            {stickersEnabled ? (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setPickerOpen((v) => {
                      if (v) return false;
                      setPickerDefaultTab("emoji");
                      setPickerSession((n) => n + 1);
                      return true;
                    });
                  }}
                  disabled={disabled}
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-blue)] disabled:opacity-40"
                  title="Sticker và emoji"
                >
                  <IconSmile className="h-[22px] w-[22px]" />
                  <span className="sr-only">Sticker và emoji</span>
                </button>
              </div>
            ) : null}

            <textarea
              ref={textareaRef}
              value={value}
              disabled={disabled}
              onChange={(e) => {
                onChange(e.target.value);
                resize();
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={placeholder}
              className="max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent px-1.5 py-2 text-[15px] leading-snug text-[var(--zalo-text)] outline-none placeholder:text-[var(--zalo-text-muted)]"
            />
            <button
              type="button"
              onClick={() => {
                if (!disabled && value.trim()) onSend();
              }}
              disabled={disabled || !value.trim()}
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--zalo-blue)] transition enabled:hover:bg-[var(--zalo-blue)] enabled:hover:text-white disabled:opacity-40"
              title="Gửi"
            >
              <IconSend className="h-[22px] w-[22px]" />
              <span className="sr-only">Gửi tin nhắn</span>
            </button>
          </div>

          {attachmentsEnabled ? (
            <AttachmentPanel
              open={attachOpen}
              onClose={() => setAttachOpen(false)}
              onPick={(action) => {
                setAttachOpen(false);
                onAttachment?.(action);
                if (action === "sticker") {
                  setPickerDefaultTab("sticker");
                  setPickerSession((n) => n + 1);
                  setPickerOpen(true);
                }
              }}
            />
          ) : null}
          <EmojiStickerPanel
            key={pickerSession}
            open={pickerOpen}
            defaultTab={pickerDefaultTab}
            onClose={() => setPickerOpen(false)}
            onSelectSticker={(stickerId, emoji) => {
              onPickSticker?.(stickerId, emoji);
            }}
            onInsertEmoji={(emoji) => {
              onInsertEmoji?.(emoji);
              queueMicrotask(() => {
                textareaRef.current?.focus();
                resize();
              });
            }}
          />
        </div>
        <p className="mt-1 hidden text-center text-[10px] text-[var(--zalo-text-muted)] sm:block">
          Shift+Enter để xuống dòng
        </p>
      </div>
    </footer>
  );
}
