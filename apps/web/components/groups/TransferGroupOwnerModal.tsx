"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { IconClose } from "@/components/chat/icons";
import { Avatar } from "@/components/common/Avatar";
import type { GroupMember } from "@/lib/types/social";

type TransferGroupOwnerModalProps = {
  open: boolean;
  members: GroupMember[];
  currentUserId: string;
  onClose: () => void;
  onConfirm: (newOwnerUserId: string) => void;
};

export function TransferGroupOwnerModal({
  open,
  members,
  currentUserId,
  onClose,
  onConfirm,
}: TransferGroupOwnerModalProps) {
  const titleId = useId();
  const candidates = useMemo(
    () => members.filter((m) => m.userId !== currentUserId && m.role !== "owner"),
    [members, currentUserId],
  );
  const [pick, setPick] = useState(() => candidates[0]?.userId ?? "");

  useEffect(() => {
    if (!open) return;
    setPick(candidates[0]?.userId ?? "");
  }, [open, candidates]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/35 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[400px] rounded-lg border border-[var(--zalo-border)] bg-white p-4 shadow-lg"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-[15px] font-semibold text-[var(--zalo-text)]">
            Chuyển quyền trưởng nhóm
          </h2>
          <button
            type="button"
            className="text-[var(--zalo-text-muted)] hover:text-[var(--zalo-text)]"
            onClick={onClose}
            title="Đóng"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-[12px] leading-snug text-[var(--zalo-text-muted)]">
          Chọn thành viên nhận quyền trước khi bạn rời nhóm.
        </p>
        <div className="mt-3 max-h-[240px] space-y-1 overflow-y-auto">
          {candidates.map((m) => {
            const sel = pick === m.userId;
            return (
              <button
                key={m.userId}
                type="button"
                onClick={() => setPick(m.userId)}
                className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition ${
                  sel
                    ? "border-[var(--zalo-blue)] bg-[var(--zalo-list-active)]"
                    : "border-transparent hover:bg-black/[0.04]"
                }`}
              >
                <input type="radio" readOnly className="pointer-events-none" checked={sel} />
                <Avatar name={m.displayName} size="sm" src={m.avatarUrl} />
                <span className="truncate text-[13px] font-medium text-[var(--zalo-text)]">{m.displayName}</span>
              </button>
            );
          })}
        </div>
        {candidates.length === 0 ? (
          <p className="mt-2 text-[12px] text-red-600">Không còn thành viên để chuyển quyền.</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="h-8 rounded-md px-3 text-[13px] font-medium hover:bg-black/[0.05]"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!pick || candidates.length === 0}
            className="h-8 rounded-md bg-[var(--zalo-blue)] px-3 text-[13px] font-semibold text-white disabled:opacity-50"
            onClick={() => onConfirm(pick)}
          >
            Chuyển & rời nhóm
          </button>
        </div>
      </div>
    </div>
  );
}
