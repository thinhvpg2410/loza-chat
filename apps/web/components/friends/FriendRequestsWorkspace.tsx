"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FriendRequestsList } from "@/components/friends/FriendRequestsList";
import { mockFriendRequests } from "@/lib/mock-social";
import type { FriendRequest } from "@/lib/types/social";

export function FriendRequestsWorkspace() {
  const [requests, setRequests] = useState<FriendRequest[]>(() => [...mockFriendRequests]);

  const incoming = useMemo(() => requests.filter((r) => r.direction === "incoming"), [requests]);
  const outgoing = useMemo(() => requests.filter((r) => r.direction === "outgoing"), [requests]);

  const remove = (id: string) => setRequests((prev) => prev.filter((r) => r.id !== id));

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
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="mx-auto flex max-w-[560px] flex-col gap-10">
          <FriendRequestsList
            title="Đến"
            requests={incoming}
            emptyTitle="Chưa có lời mời"
            emptyDescription="Ai đó gửi lời mời kết bạn sẽ xuất hiện ở đây."
            onAccept={remove}
            onReject={remove}
          />
          <FriendRequestsList
            title="Đi"
            requests={outgoing}
            emptyTitle="Không có lời mời đang chờ"
            emptyDescription="Các lời mời bạn gửi đi sẽ hiển thị trong mục này."
            onCancel={remove}
          />
        </div>
      </div>
    </div>
  );
}
