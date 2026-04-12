"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { IconMore } from "@/components/chat/icons";

export type ActionMenuItem = {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

type ActionMenuProps = {
  items: ActionMenuItem[];
  ariaLabel?: string;
  align?: "left" | "right";
  /** Smaller trigger for dense list rows. */
  compact?: boolean;
};

export function ActionMenu({
  items,
  ariaLabel = "Thao tác",
  align = "right",
  compact = false,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        className={
          compact
            ? "flex h-6 w-6 items-center justify-center rounded text-[var(--zalo-text-muted)] opacity-80 transition hover:bg-black/[0.05] hover:text-[var(--zalo-text)] hover:opacity-100"
            : "flex h-7 w-7 items-center justify-center rounded-md text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06] hover:text-[var(--zalo-text)]"
        }
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={listId}
        title={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <IconMore className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
        <span className="sr-only">{ariaLabel}</span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="menu"
          className={`absolute z-50 mt-1 min-w-[160px] rounded-md border border-[var(--zalo-border)] bg-white py-1 shadow-sm ring-1 ring-black/[0.04] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={
                  item.disabled
                    ? "flex w-full cursor-not-allowed px-3 py-1.5 text-left text-[13px] text-[var(--zalo-text-muted)] opacity-50"
                    : item.danger
                      ? "flex w-full px-3 py-1.5 text-left text-[13px] text-red-600 transition hover:bg-red-50"
                      : "flex w-full px-3 py-1.5 text-left text-[13px] text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)]"
                }
                onClick={() => {
                  if (item.disabled) return;
                  item.onSelect();
                  close();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
