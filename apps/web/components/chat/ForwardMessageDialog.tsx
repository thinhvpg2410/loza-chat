"use client";

import { useEffect, useId } from "react";
import type { Conversation } from "@/lib/types/chat";

type ForwardMessageDialogProps = {
  open: boolean;
  title?: string;
  options: Conversation[];
  busyConversationId?: string | null;
  error?: string | null;
  onClose: () => void;
  onPickConversation: (conversationId: string) => void;
};

export function ForwardMessageDialog({
  open,
  title = "Chuyển tiếp tin nhắn",
  options,
  busyConversationId = null,
  error = null,
  onClose,
  onPickConversation,
}: ForwardMessageDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-4">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Đóng" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-[420px] rounded-lg border border-[var(--zalo-border)] bg-white shadow-lg"
      >
        <div className="border-b border-[var(--zalo-border)] px-4 py-3">
          <h2 id={titleId} className="text-[15px] font-semibold text-[var(--zalo-text)]">
            {title}
          </h2>
        </div>
        {error ? (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700" role="alert">
            {error}
          </div>
        ) : null}
        <div className="max-h-[320px] overflow-y-auto px-2 py-2">
          {options.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] text-[var(--zalo-text-muted)]">
              Không có hội thoại phù hợp để chuyển tiếp.
            </p>
          ) : (
            options.map((c) => {
              const busy = busyConversationId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={busyConversationId !== null}
                  onClick={() => onPickConversation(c.id)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left transition hover:bg-[var(--zalo-surface)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[var(--zalo-text)]">{c.title}</p>
                    <p className="truncate text-[11px] text-[var(--zalo-text-muted)]">{c.lastMessagePreview || "—"}</p>
                  </div>
                  <span className="ml-2 text-[12px] font-medium text-[var(--zalo-blue)]">
                    {busy ? "Đang gửi…" : "Chọn"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
