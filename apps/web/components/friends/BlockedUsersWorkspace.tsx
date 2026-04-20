"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { fetchBlockedUsersAction, unblockUserAction } from "@/features/friends/friends-actions";
import type { ApiBlockedListEntry } from "@/lib/friends/api-dtos";

export type BlockedUsersWorkspaceProps = {
  source?: "mock" | "api";
  initialBlocked?: ApiBlockedListEntry[];
  initialError?: string | null;
};

export function BlockedUsersWorkspace({
  source = "mock",
  initialBlocked = [],
  initialError = null,
}: BlockedUsersWorkspaceProps) {
  const router = useRouter();
  const isApi = source === "api";
  const [rows, setRows] = useState<ApiBlockedListEntry[]>(() => (isApi ? initialBlocked : []));
  const [listError, setListError] = useState<string | null>(() => (isApi ? initialError : null));
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isApi) return;
    queueMicrotask(() => {
      setRows(initialBlocked);
      setListError(initialError);
    });
  }, [isApi, initialBlocked, initialError]);

  const refresh = useCallback(async () => {
    if (!isApi) return;
    const r = await fetchBlockedUsersAction();
    if (!r.ok) {
      setListError(r.error);
      return;
    }
    setListError(null);
    setRows(r.blocks);
  }, [isApi]);

  const runUnblock = useCallback(
    async (userId: string) => {
      setBusyId(userId);
      setConfirmUserId(null);
      const r = await unblockUserAction(userId);
      setBusyId(null);
      if (!r.ok) {
        setToast(r.error);
        return;
      }
      setToast("Đã bỏ chặn.");
      await refresh();
      router.refresh();
    },
    [refresh, router],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--zalo-chat-bg)]">
      <header className="shrink-0 border-b border-[var(--zalo-border)] bg-white px-3 pb-2.5 pt-2.5">
        <div className="flex items-center gap-2">
          <Link
            href="/friends"
            className="rounded-md px-1 py-0.5 text-[13px] font-medium text-[var(--zalo-blue)] hover:underline"
          >
            ← Bạn bè
          </Link>
        </div>
        <h1 className="mt-1 text-[16px] font-semibold text-[var(--zalo-text)]">Đã chặn</h1>
        <p className="mt-0.5 text-[12px] text-[var(--zalo-text-muted)]">
          Danh sách người bạn đã chặn. Bỏ chặn để có thể tìm và xem hồ sơ lại.
        </p>
      </header>

      {listError ? (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-3 py-2 text-center text-[12px] text-red-700">
          {listError}
        </div>
      ) : null}

      {toast ? (
        <div className="shrink-0 border-b border-[var(--zalo-border)] bg-[var(--zalo-surface)] px-3 py-1.5 text-center text-[12px] text-[var(--zalo-text)]">
          {toast}
          <button type="button" className="ml-2 text-[var(--zalo-blue)] underline" onClick={() => setToast(null)}>
            Đóng
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--zalo-surface)] px-2 py-2">
        {!isApi ? (
          <p className="px-2 py-6 text-center text-[13px] text-[var(--zalo-text-muted)]">
            Đăng nhập qua API để xem danh sách chặn.
          </p>
        ) : rows.length === 0 ? (
          <p className="px-2 py-6 text-center text-[13px] text-[var(--zalo-text-muted)]">Chưa chặn ai.</p>
        ) : (
          <ul className="flex flex-col gap-px">
            {rows.map((row) => {
              const u = row.user;
              const name = u.displayName?.trim() || "Người dùng";
              return (
                <li
                  key={u.id}
                  className="flex items-center gap-2 rounded-md bg-white px-2 py-2 ring-1 ring-black/[0.04]"
                >
                  <Avatar name={name} size="contact" src={u.avatarUrl ?? undefined} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[var(--zalo-text)]">{name}</p>
                    {u.username ? (
                      <p className="truncate text-[12px] text-[var(--zalo-text-muted)]">@{u.username}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={busyId === u.id}
                    className="shrink-0 rounded-md border border-[var(--zalo-border)] bg-white px-2.5 py-1 text-[12px] font-semibold text-[var(--zalo-blue)] disabled:opacity-50"
                    onClick={() => setConfirmUserId(u.id)}
                  >
                    {busyId === u.id ? "…" : "Bỏ chặn"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmUserId !== null}
        title="Bỏ chặn?"
        description="Người này sẽ có thể xuất hiện trong tìm kiếm và bạn có thể xem hồ sơ công khai của họ."
        confirmLabel="Bỏ chặn"
        busy={busyId !== null}
        onClose={() => {
          if (busyId !== null) return;
          setConfirmUserId(null);
        }}
        onConfirm={() => {
          if (confirmUserId) void runUnblock(confirmUserId);
        }}
      />
    </div>
  );
}
