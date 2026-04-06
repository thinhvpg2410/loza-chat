"use client";

import { useEffect, useId, useState } from "react";
import { IconClose, IconSearch } from "@/components/chat/icons";
import { Avatar } from "@/components/common/Avatar";
import { mockSearchUsers } from "@/lib/mock-social";
import type { SearchableUser } from "@/lib/types/social";

type AddFriendModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AddFriendModal({ open, onClose }: AddFriendModalProps) {
  const titleId = useId();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableUser[]>([]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setResults(mockSearchUsers(query));
    }, 180);
    return () => window.clearTimeout(t);
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim();
  const showShort = q.length > 0 && q.length < 2;
  const showEmpty = q.length >= 2 && results.length === 0;
  const showResults = q.length >= 2 && !showEmpty;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(88dvh,440px)] w-full max-w-[360px] flex-col overflow-hidden rounded-lg border border-[var(--zalo-border)] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--zalo-border)] px-3 py-2">
          <h2 id={titleId} className="text-[14px] font-semibold text-[var(--zalo-text)]">
            Thêm bạn
          </h2>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06]"
            onClick={onClose}
            title="Đóng"
          >
            <IconClose className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="shrink-0 bg-[var(--zalo-chat-bg)] px-3 pb-2.5 pt-2.5">
          <label htmlFor={inputId} className="sr-only">
            Số điện thoại hoặc tên người dùng
          </label>
          <div className="rounded-lg border border-[var(--zalo-border)] bg-white shadow-sm transition focus-within:border-[var(--zalo-blue)] focus-within:shadow-[0_0_0_3px_rgba(0,104,255,0.12)]">
            <div className="relative">
              <IconSearch
                className="pointer-events-none absolute left-2.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[var(--zalo-blue)] opacity-70"
                aria-hidden
              />
              <input
                id={inputId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Số điện thoại hoặc tên"
                autoComplete="off"
                autoFocus
                className="h-9 w-full rounded-lg border-0 bg-transparent pl-9 pr-3 text-[13px] text-[var(--zalo-text)] outline-none placeholder:text-[var(--zalo-text-muted)]"
              />
            </div>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-[var(--zalo-text-subtle)]">
            Tối thiểu 2 ký tự. Gợi ý: <span className="text-[var(--zalo-text-muted)]">ngọc</span>,{" "}
            <span className="text-[var(--zalo-text-muted)]">minh</span>,{" "}
            <span className="text-[var(--zalo-text-muted)]">tuấn</span>.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--zalo-border)] bg-[var(--zalo-surface)] px-2 py-1.5">
          {q.length === 0 ? (
            <p className="py-3 text-center text-[12px] leading-snug text-[var(--zalo-text-muted)]">
              Nhập để tìm người dùng.
            </p>
          ) : null}
          {showShort ? (
            <p className="py-3 text-center text-[12px] leading-snug text-[var(--zalo-text-muted)]">
              Nhập thêm ký tự.
            </p>
          ) : null}
          {q.length >= 2 && showEmpty ? (
            <p className="py-3 text-center text-[12px] leading-snug text-[var(--zalo-text-muted)]">
              Không tìm thấy kết quả.
            </p>
          ) : null}
          {showResults ? (
            <div className="overflow-hidden rounded-md border border-[var(--zalo-border)]/90 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <ul className="divide-y divide-[var(--zalo-border)]/70">
                {results.map((u) => (
                  <li key={u.id}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Avatar name={u.displayName} size="contact" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium leading-tight text-[var(--zalo-text)]">
                          {u.displayName}
                        </div>
                        <div className="truncate text-[11px] leading-tight text-[var(--zalo-text-subtle)]">
                          @{u.username}
                          {u.phone ? ` · ${u.phone}` : ""}
                        </div>
                      </div>
                      <AddFriendActions user={u} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AddFriendActions({ user }: { user: SearchableUser }) {
  const btnGhost =
    "inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-[var(--zalo-border)]/90 bg-white px-2 text-[11px] font-medium text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)]";
  const btnPrimary =
    "inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-[var(--zalo-blue)] px-2 text-[11px] font-medium text-white/95 transition hover:bg-[#0056d6] active:bg-[#004ec4]";
  const btnMuted =
    "inline-flex h-7 shrink-0 cursor-not-allowed items-center justify-center rounded-md border border-transparent bg-[var(--zalo-surface)] px-2 text-[11px] font-medium text-[var(--zalo-text-muted)]";

  if (user.relation === "friend") {
    return (
      <button type="button" className={btnMuted} disabled>
        Đã là bạn
      </button>
    );
  }
  if (user.relation === "pending_out") {
    return (
      <button type="button" className={btnMuted} disabled>
        Đang chờ
      </button>
    );
  }
  if (user.relation === "pending_in") {
    return (
      <div className="flex shrink-0 gap-1">
        <button type="button" className={btnGhost}>
          Từ chối
        </button>
        <button type="button" className={btnPrimary}>
          Đồng ý
        </button>
      </div>
    );
  }
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={btnGhost}>
        Nhắn tin
      </button>
      <button type="button" className={btnPrimary}>
        Kết bạn
      </button>
    </div>
  );
}
