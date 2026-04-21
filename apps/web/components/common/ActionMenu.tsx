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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(0);

  const close = useCallback(() => setOpen(false), []);

  const moveActive = useCallback(
    (delta: number) => {
      if (items.length === 0) return;
      let idx = activeIndex;
      for (let i = 0; i < items.length; i += 1) {
        idx = (idx + delta + items.length) % items.length;
        if (!items[idx]?.disabled) {
          setActiveIndex(idx);
          itemRefs.current[idx]?.focus();
          return;
        }
      }
    },
    [activeIndex, items],
  );

  useEffect(() => {
    if (!open) return;
    const firstEnabled = items.findIndex((item) => !item.disabled);
    setActiveIndex(firstEnabled >= 0 ? firstEnabled : 0);
    queueMicrotask(() => {
      if (firstEnabled >= 0) itemRefs.current[firstEnabled]?.focus();
    });
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!rootRef.current?.contains(document.activeElement)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveActive(1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveActive(-1);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        moveActive(e.shiftKey ? -1 : 1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        const idx = items.findIndex((item) => !item.disabled);
        if (idx >= 0) {
          setActiveIndex(idx);
          itemRefs.current[idx]?.focus();
        }
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        const idx = [...items].reverse().findIndex((item) => !item.disabled);
        if (idx >= 0) {
          const realIndex = items.length - 1 - idx;
          setActiveIndex(realIndex);
          itemRefs.current[realIndex]?.focus();
        }
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, items, moveActive]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        ref={triggerRef}
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
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
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
                ref={(el) => {
                  itemRefs.current[items.indexOf(item)] = el;
                }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                tabIndex={items.indexOf(item) === activeIndex ? 0 : -1}
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
                  triggerRef.current?.focus();
                }}
                onFocus={() => setActiveIndex(items.indexOf(item))}
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
