"use client";

import type { ApiJoinQueueItem } from "@/lib/chat/api-dtos";
import { Avatar } from "@/components/common/Avatar";

type JoinRequestListProps = {
  items: ApiJoinQueueItem[];
  nameByUserId: Record<string, string>;
  canModerate: boolean;
  busyUserId: string | null;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
};

export function JoinRequestList({
  items,
  nameByUserId,
  canModerate,
  busyUserId,
  onApprove,
  onReject,
}: JoinRequestListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[var(--zalo-border)]/80 bg-white px-2 py-2 text-center text-[12px] text-[var(--zalo-text-muted)]">
        Không có yêu cầu chờ duyệt.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((it) => {
        const name = nameByUserId[it.userId] ?? it.userId.slice(0, 8);
        const label = it.kind === "self_request" ? "Xin vào nhóm" : "Được mời (chờ)";
        const busy = busyUserId === it.userId;
        return (
          <li
            key={`${it.kind}-${it.userId}`}
            className="flex items-center gap-2 rounded-md border border-[var(--zalo-border)]/70 bg-white px-2 py-1.5"
          >
            <Avatar name={name} size="contact" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[var(--zalo-text)]">{name}</p>
              <p className="text-[11px] text-[var(--zalo-text-muted)]">{label}</p>
            </div>
            {canModerate ? (
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-md bg-[var(--zalo-blue)] px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                  onClick={() => onApprove(it.userId)}
                >
                  Duyệt
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-md border border-[var(--zalo-border)] px-2 py-1 text-[11px] font-medium text-[var(--zalo-text)] disabled:opacity-50"
                  onClick={() => onReject(it.userId)}
                >
                  Từ chối
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
