"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  acceptFriendRequestAction,
  cancelFriendRequestAction,
  fetchIncomingRequestsAction,
  fetchOutgoingRequestsAction,
  rejectFriendRequestAction,
} from "@/features/friends/friends-actions";
import { FriendRequestsList } from "@/components/friends/FriendRequestsList";
import { mapIncomingRequest, mapOutgoingRequest } from "@/lib/friends/map-api-social";
import { mockFriendRequests } from "@/lib/mock-social";
import type { FriendRequest } from "@/lib/types/social";

export type FriendRequestsWorkspaceProps = {
  source?: "mock" | "api";
  initialIncoming?: FriendRequest[];
  initialOutgoing?: FriendRequest[];
  initialError?: string | null;
};

export function FriendRequestsWorkspace({
  source = "mock",
  initialIncoming = [],
  initialOutgoing = [],
  initialError = null,
}: FriendRequestsWorkspaceProps) {
  const router = useRouter();
  const isApi = source === "api";

  const [incoming, setIncoming] = useState<FriendRequest[]>(() =>
    isApi ? initialIncoming : mockFriendRequests.filter((r) => r.direction === "incoming"),
  );
  const [outgoing, setOutgoing] = useState<FriendRequest[]>(() =>
    isApi ? initialOutgoing : mockFriendRequests.filter((r) => r.direction === "outgoing"),
  );
  const [pageError, setPageError] = useState<string | null>(() => (isApi ? initialError : null));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isApi) return;
    queueMicrotask(() => {
      setIncoming(initialIncoming);
      setOutgoing(initialOutgoing);
      setPageError(initialError);
    });
  }, [isApi, initialIncoming, initialOutgoing, initialError]);

  const refresh = useCallback(async () => {
    if (!isApi) return;
    const [inc, out] = await Promise.all([
      fetchIncomingRequestsAction(),
      fetchOutgoingRequestsAction(),
    ]);
    if (inc.ok) setIncoming(inc.requests.map(mapIncomingRequest));
    if (out.ok) setOutgoing(out.requests.map(mapOutgoingRequest));
  }, [isApi]);

  const onAccept = async (id: string) => {
    if (!isApi) {
      setIncoming((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    setBusyId(id);
    const r = await acceptFriendRequestAction(id);
    setBusyId(null);
    if (!r.ok) {
      setToast(r.error);
      return;
    }
    setToast("Đã chấp nhận.");
    setIncoming((prev) => prev.filter((x) => x.id !== id));
    await refresh();
    router.refresh();
  };

  const onReject = async (id: string) => {
    if (!isApi) {
      setIncoming((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    setBusyId(id);
    const r = await rejectFriendRequestAction(id);
    setBusyId(null);
    if (!r.ok) {
      setToast(r.error);
      return;
    }
    setToast("Đã từ chối.");
    setIncoming((prev) => prev.filter((x) => x.id !== id));
    await refresh();
    router.refresh();
  };

  const onCancel = async (id: string) => {
    if (!isApi) {
      setOutgoing((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    setBusyId(id);
    const r = await cancelFriendRequestAction(id);
    setBusyId(null);
    if (!r.ok) {
      setToast(r.error);
      return;
    }
    setToast("Đã thu hồi lời mời.");
    setOutgoing((prev) => prev.filter((x) => x.id !== id));
    await refresh();
    router.refresh();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--zalo-chat-bg)]">
      <header className="shrink-0 border-b border-[var(--zalo-border)] bg-white px-3 pb-2.5 pt-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-[16px] font-semibold text-[var(--zalo-text)]">Lời mời kết bạn</h1>
            <Link
              href="/friends"
              className="mt-1 inline-block text-[12px] font-medium text-[var(--zalo-blue)] hover:underline"
            >
              ← Danh sách bạn bè
            </Link>
          </div>
        </div>
      </header>
      {pageError ? (
        <div
          className="shrink-0 border-b border-red-200 bg-red-50 px-3 py-2 text-center text-[12px] text-red-700"
          role="alert"
        >
          {pageError}
        </div>
      ) : null}
      {toast ? (
        <div className="shrink-0 border-b border-[var(--zalo-border)] bg-[var(--zalo-surface)] px-3 py-1.5 text-center text-[12px] text-[var(--zalo-text)]">
          {toast}
          <button
            type="button"
            className="ml-2 text-[var(--zalo-blue)] underline"
            onClick={() => setToast(null)}
          >
            Đóng
          </button>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="mx-auto flex max-w-[560px] flex-col gap-10">
          <FriendRequestsList
            title="Đến"
            requests={incoming}
            emptyTitle="Chưa có lời mời"
            emptyDescription="Ai đó gửi lời mời kết bạn sẽ xuất hiện ở đây."
            busyRequestId={busyId}
            onAccept={(id) => void onAccept(id)}
            onReject={(id) => void onReject(id)}
          />
          <FriendRequestsList
            title="Đi"
            requests={outgoing}
            emptyTitle="Không có lời mời đang chờ"
            emptyDescription="Các lời mời bạn gửi đi sẽ hiển thị trong mục này."
            busyRequestId={busyId}
            onCancel={(id) => void onCancel(id)}
          />
        </div>
      </div>
    </div>
  );
}
