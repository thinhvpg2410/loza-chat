"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";
import { IconImage, IconSend, IconSmile } from "@/components/chat/icons";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export function Composer({
  value,
  onChange,
  onSend,
  placeholder = "Nhập tin nhắn, nhấn Enter để gửi",
  disabled = false,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <footer className="shrink-0 border-t border-[var(--zalo-border)] bg-white px-3 py-2">
      <div className="flex items-end gap-1 rounded-2xl border border-[var(--zalo-border)] bg-white px-1 py-1 focus-within:border-[var(--zalo-blue)] focus-within:ring-2 focus-within:ring-[var(--zalo-blue)]/20">
        <button
          type="button"
          className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-blue)]"
          title="Emoji"
          disabled={disabled}
        >
          <IconSmile className="h-6 w-6" />
          <span className="sr-only">Chèn emoji</span>
        </button>
        <button
          type="button"
          className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-blue)]"
          title="Đính kèm"
          disabled={disabled}
        >
          <IconImage className="h-6 w-6" />
          <span className="sr-only">Đính kèm ảnh</span>
        </button>
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
          className="max-h-[120px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-snug text-[var(--zalo-text)] outline-none placeholder:text-[var(--zalo-text-muted)]"
        />
        <button
          type="button"
          onClick={() => {
            if (!disabled && value.trim()) onSend();
          }}
          disabled={disabled || !value.trim()}
          className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--zalo-blue)] transition enabled:hover:bg-[var(--zalo-blue)] enabled:hover:text-white disabled:opacity-40"
          title="Gửi"
        >
          <IconSend className="h-6 w-6" />
          <span className="sr-only">Gửi tin nhắn</span>
        </button>
      </div>
      <p className="mt-1 hidden text-center text-[11px] text-[var(--zalo-text-muted)] sm:block">
        Shift+Enter để xuống dòng
      </p>
    </footer>
  );
}
