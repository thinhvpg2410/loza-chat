"use client";

import { useEffect, useId, useState } from "react";
import { IconClose, IconSearch } from "@/components/chat/icons";
import { Avatar } from "@/components/common/Avatar";
import {
  acceptIncomingForUserAction,
  cancelOutgoingForUserAction,
  rejectIncomingForUserAction,
  searchUsersExactAction,
  sendFriendRequestAction,
} from "@/features/friends/friends-actions";
import { mockSearchUsers } from "@/lib/mock-social";
import type { RelationshipStatus, SearchableUser } from "@/lib/types/social";

type SearchMode = "username" | "email" | "phoneNumber";

type AddFriendModalProps = {
  open: boolean;
  onClose: () => void;
  source?: "mock" | "api";
  onFriendshipChanged?: () => void;
};

function mapRelationFromStatus(s: RelationshipStatus): SearchableUser["relation"] {
  switch (s) {
    case "friend":
      return "friend";
    case "outgoing_request":
      return "pending_out";
    case "incoming_request":
      return "pending_in";
    default:
      return "none";
  }
}

export function AddFriendModal({
  open,
  onClose,
  source = "mock",
  onFriendshipChanged,
}: AddFriendModalProps) {
  const titleId = useId();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("username");
  const [results, setResults] = useState<SearchableUser[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (source !== "mock") return;
    const t = window.setTimeout(() => {
      setResults(mockSearchUsers(query));
    }, 180);
    return () => window.clearTimeout(t);
  }, [open, query, source]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setApiError(null);
      setRowError(null);
      if (source === "api") {
        setResults([]);
      }
    });
  }, [open, source, mode]);

  if (!open) return null;

  const q = query.trim();
  const isMock = source === "mock";
  const showShort = isMock && q.length > 0 && q.length < 2;
  const showEmpty = isMock && q.length >= 2 && results.length === 0;
  const showResults = isMock ? q.length >= 2 && !showEmpty : results.length > 0;

  const runApiSearch = async () => {
    setApiError(null);
    setResults([]);
    const v = query.trim();
    if (!v) {
      setApiError("Nhập giá trị tìm kiếm.");
      return;
    }
    if (mode === "username") {
      const low = v.toLowerCase();
      if (low.length < 3) {
        setApiError("Username tối thiểu 3 ký tự (chữ thường, số, _).");
        return;
      }
      if (!/^[a-z0-9_]+$/.test(low)) {
        setApiError("Username chỉ gồm chữ thường, số và gạch dưới.");
        return;
      }
    }
    if (mode === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setApiError("Email không hợp lệ.");
        return;
      }
    }
    if (mode === "phoneNumber") {
      if (!/^\+[1-9]\d{6,14}$/.test(v)) {
        setApiError("Số điện thoại dạng E.164, ví dụ +84901234567.");
        return;
      }
    }

    setApiLoading(true);
    const r = await searchUsersExactAction(mode, mode === "username" ? v.toLowerCase() : v);
    setApiLoading(false);
    if (!r.ok) {
      setApiError(r.error);
      return;
    }
    const mapped: SearchableUser[] = r.results.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      username: row.username ?? "",
      avatarUrl: row.avatarUrl ?? undefined,
      relation: mapRelationFromStatus(row.relationshipStatus),
      relationshipStatus: row.relationshipStatus,
    }));
    setResults(mapped);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(88dvh,480px)] w-full max-w-[360px] flex-col overflow-hidden rounded-lg border border-[var(--zalo-border)] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
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
          {source === "api" ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {(
                [
                  ["username", "Username"],
                  ["email", "Email"],
                  ["phoneNumber", "SĐT E.164"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={
                    mode === m
                      ? "rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[var(--zalo-blue)] shadow-sm ring-1 ring-black/[0.06]"
                      : "rounded-full px-2.5 py-0.5 text-[11px] font-medium text-[var(--zalo-text-muted)] hover:text-[var(--zalo-text)]"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <label htmlFor={inputId} className="sr-only">
            Tìm người dùng
          </label>
          <div className="rounded-lg border border-[var(--zalo-border)] bg-white shadow-sm transition focus-within:border-[var(--zalo-blue)] focus-within:shadow-[0_0_0_3px_rgba(0,104,255,0.12)]">
            <div className="relative flex items-center gap-1 pr-1">
              <IconSearch
                className="pointer-events-none absolute left-2.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[var(--zalo-blue)] opacity-70"
                aria-hidden
              />
              <input
                id={inputId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && source === "api") {
                    e.preventDefault();
                    void runApiSearch();
                  }
                }}
                placeholder={
                  source === "api"
                    ? mode === "phoneNumber"
                      ? "+84901234567"
                      : mode === "email"
                        ? "email@example.com"
                        : "username"
                    : "Số điện thoại hoặc tên"
                }
                autoComplete="off"
                autoFocus
                className="h-9 min-w-0 flex-1 rounded-lg border-0 bg-transparent py-2 pl-9 pr-2 text-[13px] text-[var(--zalo-text)] outline-none placeholder:text-[var(--zalo-text-muted)]"
              />
              {source === "api" ? (
                <button
                  type="button"
                  disabled={apiLoading}
                  onClick={() => void runApiSearch()}
                  className="shrink-0 rounded-md bg-[var(--zalo-blue)] px-2.5 py-1 text-[12px] font-semibold text-white disabled:opacity-50"
                >
                  {apiLoading ? "…" : "Tìm"}
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-[var(--zalo-text-subtle)]">
            {source === "api"
              ? "Tìm chính xác theo một trường (username, email hoặc số E.164)."
              : "Tối thiểu 2 ký tự. Gợi ý: ngọc, minh, tuấn."}
          </p>
          {apiError ? (
            <p className="mt-1.5 text-[11px] text-red-600/90" role="alert">
              {apiError}
            </p>
          ) : null}
          {rowError ? (
            <p className="mt-1.5 text-[11px] text-red-600/90" role="alert">
              {rowError}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--zalo-border)] bg-[var(--zalo-surface)] px-2 py-1.5">
          {isMock && q.length === 0 ? (
            <p className="py-3 text-center text-[12px] leading-snug text-[var(--zalo-text-muted)]">
              Nhập để tìm người dùng.
            </p>
          ) : null}
          {showShort ? (
            <p className="py-3 text-center text-[12px] leading-snug text-[var(--zalo-text-muted)]">
              Nhập thêm ký tự.
            </p>
          ) : null}
          {isMock && q.length >= 2 && showEmpty ? (
            <p className="py-3 text-center text-[12px] leading-snug text-[var(--zalo-text-muted)]">
              Không tìm thấy kết quả.
            </p>
          ) : null}
          {source === "api" && !apiLoading && results.length === 0 && q.length > 0 && !apiError ? (
            <p className="py-3 text-center text-[12px] text-[var(--zalo-text-muted)]">
              Nhấn Tìm hoặc Enter.
            </p>
          ) : null}
          {source === "api" && apiLoading ? (
            <p className="py-3 text-center text-[12px] text-[var(--zalo-text-muted)]">Đang tìm…</p>
          ) : null}
          {showResults ? (
            <div className="overflow-hidden rounded-md border border-[var(--zalo-border)]/90 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <ul className="divide-y divide-[var(--zalo-border)]/70">
                {results.map((u) => (
                  <li key={u.id}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Avatar name={u.displayName} size="contact" src={u.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium leading-tight text-[var(--zalo-text)]">
                          {u.displayName}
                        </div>
                        <div className="truncate text-[11px] leading-tight text-[var(--zalo-text-subtle)]">
                          {u.username ? `@${u.username}` : "—"}
                          {u.phone ? ` · ${u.phone}` : ""}
                        </div>
                      </div>
                      <AddFriendRowActions
                        user={u}
                        source={source}
                        busy={rowBusyId === u.id}
                        setBusy={(b) => setRowBusyId(b ? u.id : null)}
                        onError={setRowError}
                        onFriendshipChanged={() => {
                          setRowError(null);
                          onFriendshipChanged?.();
                          if (source === "api") void runApiSearch();
                        }}
                      />
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

function AddFriendRowActions({
  user,
  source,
  busy,
  setBusy,
  onError,
  onFriendshipChanged,
}: {
  user: SearchableUser;
  source: "mock" | "api";
  busy: boolean;
  setBusy: (v: boolean) => void;
  onError?: (message: string) => void;
  onFriendshipChanged?: () => void;
}) {
  const btnGhost =
    "inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-[var(--zalo-border)]/90 bg-white px-2 text-[11px] font-medium text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)] disabled:opacity-45";
  const btnPrimary =
    "inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-[var(--zalo-blue)] px-2 text-[11px] font-medium text-white/95 transition hover:bg-[#0056d6] active:bg-[#004ec4] disabled:opacity-45";
  const btnMuted =
    "inline-flex h-7 shrink-0 cursor-not-allowed items-center justify-center rounded-md border border-transparent bg-[var(--zalo-surface)] px-2 text-[11px] font-medium text-[var(--zalo-text-muted)]";

  const status = user.relationshipStatus;
  const useApi = source === "api" && status;

  if (!useApi) {
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
          <button type="button" className={btnGhost} disabled>
            Từ chối
          </button>
          <button type="button" className={btnPrimary} disabled>
            Đồng ý
          </button>
        </div>
      );
    }
    return (
      <div className="flex shrink-0 gap-1">
        <button type="button" className={btnGhost} disabled>
          Nhắn tin
        </button>
        <button type="button" className={btnPrimary} disabled>
          Kết bạn
        </button>
      </div>
    );
  }

  if (status === "self") {
    return (
      <button type="button" className={btnMuted} disabled>
        Là bạn
      </button>
    );
  }
  if (status === "friend") {
    return (
      <button type="button" className={btnMuted} disabled>
        Đã là bạn
      </button>
    );
  }
  if (status === "blocked_by_me" || status === "blocked_me") {
    return (
      <button type="button" className={btnMuted} disabled>
        Đã chặn
      </button>
    );
  }
  if (status === "outgoing_request") {
    return (
      <button
        type="button"
        className={btnGhost}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await cancelOutgoingForUserAction(user.id);
          setBusy(false);
          if (r.ok) onFriendshipChanged?.();
          else onError?.(r.error);
        }}
      >
        Thu hồi
      </button>
    );
  }
  if (status === "incoming_request") {
    return (
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          className={btnGhost}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await rejectIncomingForUserAction(user.id);
            setBusy(false);
            if (r.ok) onFriendshipChanged?.();
            else onError?.(r.error);
          }}
        >
          Từ chối
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await acceptIncomingForUserAction(user.id);
            setBusy(false);
            if (r.ok) onFriendshipChanged?.();
            else onError?.(r.error);
          }}
        >
          Đồng ý
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={btnPrimary}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await sendFriendRequestAction(user.id);
        setBusy(false);
        if (r.ok) onFriendshipChanged?.();
        else onError?.(r.error);
      }}
    >
      Kết bạn
    </button>
  );
}
