"use client";

import { useEffect, useId } from "react";
import { IconClose } from "@/components/chat/icons";
import { ProfileActionBar } from "@/components/profile/ProfileActionBar";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import type { ProfileUser } from "@/lib/types/social";

type UserProfileDrawerProps = {
  open: boolean;
  user: ProfileUser | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onMessage?: () => void;
  onAddFriend?: () => void;
  onBlock?: () => void;
  onUnfriend?: () => void;
  onUnblock?: () => void;
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
  onCancelOutgoing?: () => void;
  actionBusy?: boolean;
};

export function UserProfileDrawer({
  open,
  user,
  loading = false,
  error = null,
  onClose,
  onMessage,
  onAddFriend,
  onBlock,
  onUnfriend,
  onUnblock,
  onAcceptRequest,
  onRejectRequest,
  onCancelOutgoing,
  actionBusy = false,
}: UserProfileDrawerProps) {
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

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/25">
      <button
        type="button"
        className="h-full min-w-0 flex-1 cursor-default"
        aria-label="Đóng hồ sơ"
        onClick={onClose}
      />
      <aside
        className="flex h-full w-full max-w-[360px] flex-col border-l border-[var(--zalo-border)] bg-white shadow-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-center justify-between border-b border-[var(--zalo-border)] px-3 py-2">
          <h2 id={titleId} className="text-[15px] font-semibold text-[var(--zalo-text)]">
            Hồ sơ
          </h2>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06]"
            onClick={onClose}
            title="Đóng"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <div className="px-4 py-6 text-center" role="alert">
              <p className="text-[13px] text-red-600/90">{error}</p>
            </div>
          ) : loading || !user ? (
            <div className="space-y-3 px-4 py-8">
              <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-[var(--zalo-surface)]" />
              <div className="mx-auto h-4 w-40 animate-pulse rounded bg-[var(--zalo-surface)]" />
              <div className="mx-auto h-3 w-28 animate-pulse rounded bg-[var(--zalo-surface)]" />
            </div>
          ) : (
            <>
              <ProfileHeader user={user} />
              <ProfileActionBar
                isSelf={user.isSelf}
                relationshipStatus={user.relationshipStatus}
                onMessage={onMessage}
                onAddFriend={onAddFriend}
                onBlock={onBlock}
                onUnfriend={onUnfriend}
                onUnblock={onUnblock}
                onAcceptRequest={onAcceptRequest}
                onRejectRequest={onRejectRequest}
                onCancelOutgoing={onCancelOutgoing}
                disabled={actionBusy}
              />
              <div className="mx-4 border-t border-[var(--zalo-border)]" />
              <section className="px-4 py-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
                  Ảnh / file
                </h3>
                <p className="mt-1 text-[13px] text-[var(--zalo-text-muted)]">Chưa có nội dung.</p>
              </section>
              <div className="mx-4 border-t border-[var(--zalo-border)]" />
              <section className="px-4 py-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
                  Nhóm chung
                </h3>
                <p className="mt-1 text-[13px] text-[var(--zalo-text-muted)]">—</p>
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
