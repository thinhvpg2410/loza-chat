"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AttachmentPanel, type AttachmentAction } from "@/components/chat/AttachmentPanel";
import { IconMic, IconPlus, IconSend, IconSmile } from "@/components/chat/icons";
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
  onComposerBlur?: () => void;
  mentionCandidates?: { userId: string; displayName: string; username: string | null }[];
  onToggleVoiceRecording?: () => void;
  isVoiceRecording?: boolean;
  voiceRecordingDurationSec?: number;
  onCancelVoiceRecording?: () => void;
};

type ActiveMentionQuery = {
  start: number;
  end: number;
  query: string;
};

function extractActiveMentionQuery(text: string, caret: number): ActiveMentionQuery | null {
  if (caret < 0 || caret > text.length) return null;
  const left = text.slice(0, caret);
  const atPos = left.lastIndexOf("@");
  if (atPos < 0) return null;
  if (atPos > 0) {
    const prev = left[atPos - 1];
    if (!/\s/.test(prev)) return null;
  }
  const token = left.slice(atPos + 1);
  if (/\s/.test(token)) return null;
  return { start: atPos, end: caret, query: token.trim().toLowerCase() };
}

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
  onComposerBlur,
  mentionCandidates = [],
  onToggleVoiceRecording,
  isVoiceRecording = false,
  voiceRecordingDurationSec = 0,
  onCancelVoiceRecording,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDefaultTab, setPickerDefaultTab] = useState<"sticker" | "emoji">("emoji");
  const [pickerSession, setPickerSession] = useState(0);
  const [caretIndex, setCaretIndex] = useState(0);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  const mentionQuery = extractActiveMentionQuery(value, caretIndex);
  const mentionItems = mentionQuery
    ? [
        ...(("@all".includes(`@${mentionQuery.query}`) || mentionQuery.query.length === 0)
          ? [{ id: "__all__", label: "Tất cả thành viên", token: "all" }]
          : []),
        ...mentionCandidates
          .filter((m) => {
            const q = mentionQuery.query;
            if (!q) return true;
            const byName = m.displayName.toLowerCase().includes(q);
            const byUser = (m.username ?? "").toLowerCase().includes(q);
            return byName || byUser;
          })
          .slice(0, 8)
          .map((m) => ({
            id: m.userId,
            label: m.displayName,
            token:
              m.username?.trim().toLowerCase() ||
              m.displayName
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, ""),
          })),
      ]
    : [];

  useEffect(() => {
    if (mentionItems.length === 0) {
      setActiveMentionIndex(0);
      return;
    }
    setActiveMentionIndex((prev) => Math.max(0, Math.min(prev, mentionItems.length - 1)));
  }, [mentionItems.length]);

  const applyMentionToken = useCallback(
    (token: string) => {
      if (!mentionQuery) return;
      const prefix = value.slice(0, mentionQuery.start);
      const suffix = value.slice(mentionQuery.end);
      const inserted = `@${token} `;
      const next = `${prefix}${inserted}${suffix}`;
      onChange(next);
      const nextCaret = prefix.length + inserted.length;
      setCaretIndex(nextCaret);
      queueMicrotask(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
        resize();
      });
    },
    [mentionQuery, onChange, resize, value],
  );

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev + 1) % mentionItems.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex((prev) => (prev - 1 + mentionItems.length) % mentionItems.length);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        const caret = e.currentTarget.selectionStart ?? value.length;
        setCaretIndex(Math.max(0, caret - 1));
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const target = mentionItems[activeMentionIndex];
        if (target) {
          applyMentionToken(target.token);
          setActiveMentionIndex(0);
          return;
        }
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  const mm = String(Math.floor(voiceRecordingDurationSec / 60)).padStart(2, "0");
  const ss = String(voiceRecordingDurationSec % 60).padStart(2, "0");

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
                setCaretIndex(e.target.selectionStart ?? e.target.value.length);
                resize();
              }}
              onSelect={(e) => {
                const target = e.currentTarget;
                setCaretIndex(target.selectionStart ?? target.value.length);
              }}
              onClick={(e) => {
                const target = e.currentTarget;
                setCaretIndex(target.selectionStart ?? target.value.length);
              }}
              onBlur={() => onComposerBlur?.()}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={placeholder}
              className="max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent px-1.5 py-2 text-[15px] leading-snug text-[var(--zalo-text)] outline-none placeholder:text-[var(--zalo-text-muted)]"
            />
            {isVoiceRecording ? (
              <div className="flex min-h-[40px] flex-1 items-center gap-2 px-1.5">
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  REC {mm}:{ss}
                </span>
                <div className="flex items-end gap-0.5 text-[var(--zalo-blue)]">
                  <span className="h-2 w-1 animate-pulse rounded bg-current [animation-delay:0ms]" />
                  <span className="h-3 w-1 animate-pulse rounded bg-current [animation-delay:120ms]" />
                  <span className="h-4 w-1 animate-pulse rounded bg-current [animation-delay:240ms]" />
                  <span className="h-3 w-1 animate-pulse rounded bg-current [animation-delay:360ms]" />
                  <span className="h-2 w-1 animate-pulse rounded bg-current [animation-delay:480ms]" />
                </div>
                <span className="text-[12px] text-[var(--zalo-text-muted)]">Đang ghi âm...</span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                if (isVoiceRecording) {
                  onToggleVoiceRecording?.();
                  return;
                }
                if (value.trim()) onSend();
              }}
              disabled={disabled || (!value.trim() && !isVoiceRecording)}
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--zalo-blue)] transition enabled:hover:bg-[var(--zalo-blue)] enabled:hover:text-white disabled:opacity-40"
              title={isVoiceRecording ? "Dừng và gửi ghi âm" : "Gửi"}
            >
              {isVoiceRecording ? <IconMic className="h-[18px] w-[18px]" /> : <IconSend className="h-[22px] w-[22px]" />}
              <span className="sr-only">{isVoiceRecording ? "Dừng và gửi ghi âm" : "Gửi tin nhắn"}</span>
            </button>
            {isVoiceRecording && onCancelVoiceRecording ? (
              <button
                type="button"
                onClick={onCancelVoiceRecording}
                disabled={disabled}
                className="mb-0.5 flex h-8 shrink-0 items-center justify-center rounded-full px-2 text-[12px] font-medium text-[var(--zalo-text-muted)] transition hover:bg-[var(--zalo-surface)] disabled:opacity-40"
                title="Hủy ghi âm"
              >
                Hủy
              </button>
            ) : null}
            {!value.trim() && onToggleVoiceRecording ? (
              <button
                type="button"
                onClick={onToggleVoiceRecording}
                disabled={disabled}
                className={`mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 ${
                  isVoiceRecording
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "text-[var(--zalo-blue)] hover:bg-[var(--zalo-blue)] hover:text-white"
                }`}
                title={isVoiceRecording ? "Dừng và gửi ghi âm" : "Ghi âm"}
              >
                <IconMic className="h-[18px] w-[18px]" />
                <span className="sr-only">{isVoiceRecording ? "Dừng ghi âm" : "Ghi âm"}</span>
              </button>
            ) : null}
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
          {mentionItems.length > 0 ? (
            <div className="absolute bottom-[52px] left-10 z-20 max-h-52 w-[min(320px,88vw)] overflow-auto rounded-lg border border-[var(--zalo-border)] bg-white py-1 shadow-lg">
              {mentionItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyMentionToken(item.token)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[var(--zalo-surface)] ${
                    idx === activeMentionIndex ? "bg-[var(--zalo-surface)]" : ""
                  }`}
                >
                  <span className="text-[13px] text-[var(--zalo-text)]">{item.label}</span>
                  <span className="text-[11px] text-[var(--zalo-text-muted)]">@{item.token}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <p className="mt-1 hidden text-center text-[10px] text-[var(--zalo-text-muted)] sm:block">
          Shift+Enter để xuống dòng
        </p>
      </div>
    </footer>
  );
}
