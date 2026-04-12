"use client";

import { useEffect, useId } from "react";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Hủy",
  variant = "default",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
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

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      : "bg-[var(--zalo-blue)] text-white hover:bg-[#0056d6] disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-[320px] rounded-lg border border-[var(--zalo-border)] bg-white p-4 shadow-lg"
      >
        <h2 id={titleId} className="text-[15px] font-semibold text-[var(--zalo-text)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-[13px] leading-snug text-[var(--zalo-text-muted)]">{description}</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            className="h-8 rounded-md px-3 text-[13px] font-medium text-[var(--zalo-text)] transition hover:bg-black/[0.05] disabled:opacity-50"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            className={`h-8 rounded-md px-3 text-[13px] font-semibold transition ${confirmClass}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
