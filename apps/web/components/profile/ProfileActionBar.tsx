import Link from "next/link";
import type { RelationshipStatus } from "@/lib/types/social";

const btnPrimary =
  "h-8 min-w-[88px] flex-1 rounded-md bg-[var(--zalo-blue)] text-[12px] font-semibold text-white transition hover:bg-[#0056d6] disabled:opacity-45";
const btnOutline =
  "h-8 min-w-[88px] flex-1 rounded-md border border-[var(--zalo-border)] bg-white text-[12px] font-semibold text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)] disabled:opacity-45";
const btnDangerOutline =
  "h-8 min-w-[88px] flex-1 rounded-md border border-red-200 bg-white text-[12px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-45";

type ProfileActionBarProps = {
  isSelf?: boolean;
  relationshipStatus?: RelationshipStatus;
  /** Disables only the “Nhắn tin” action while opening a direct chat. */
  messageOpening?: boolean;
  onMessage?: () => void;
  onAddFriend?: () => void;
  onBlock?: () => void;
  onUnfriend?: () => void;
  onUnblock?: () => void;
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
  onCancelOutgoing?: () => void;
  disabled?: boolean;
};

export function ProfileActionBar({
  isSelf,
  relationshipStatus = "none",
  messageOpening = false,
  onMessage,
  onAddFriend,
  onBlock,
  onUnfriend,
  onUnblock,
  onAcceptRequest,
  onRejectRequest,
  onCancelOutgoing,
  disabled,
}: ProfileActionBarProps) {
  if (isSelf) {
    return (
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <Link
          href="/settings"
          className="flex h-9 flex-1 items-center justify-center rounded-md border border-[var(--zalo-border)] bg-white text-center text-[13px] font-semibold text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)]"
        >
          Chỉnh sửa hồ sơ
        </Link>
      </div>
    );
  }

  if (relationshipStatus === "blocked_by_me") {
    return (
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <button type="button" className={btnOutline} onClick={onUnblock} disabled={disabled}>
          Bỏ chặn
        </button>
      </div>
    );
  }

  if (relationshipStatus === "incoming_request") {
    return (
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <button type="button" className={btnOutline} onClick={onRejectRequest} disabled={disabled}>
          Từ chối
        </button>
        <button type="button" className={btnPrimary} onClick={onAcceptRequest} disabled={disabled}>
          Đồng ý
        </button>
        <button type="button" className={`${btnDangerOutline} basis-full sm:basis-auto`} onClick={onBlock} disabled={disabled}>
          Chặn
        </button>
      </div>
    );
  }

  if (relationshipStatus === "outgoing_request") {
    return (
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <button type="button" className={btnOutline} onClick={onCancelOutgoing} disabled={disabled}>
          Thu hồi lời mời
        </button>
        <button type="button" className={btnDangerOutline} onClick={onBlock} disabled={disabled}>
          Chặn
        </button>
      </div>
    );
  }

  if (relationshipStatus === "friend") {
    return (
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <button
          type="button"
          className={btnPrimary}
          onClick={onMessage}
          disabled={disabled || messageOpening}
        >
          {messageOpening ? "Đang mở…" : "Nhắn tin"}
        </button>
        <button type="button" className={btnOutline} onClick={onUnfriend} disabled={disabled}>
          Hủy kết bạn
        </button>
        <button type="button" className={btnDangerOutline} onClick={onBlock} disabled={disabled}>
          Chặn
        </button>
      </div>
    );
  }

  /* none, self edge, blocked_me (rare in UI) */
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      <button type="button" className={btnPrimary} onClick={onAddFriend} disabled={disabled}>
        Kết bạn
      </button>
      <button type="button" className={btnDangerOutline} onClick={onBlock} disabled={disabled}>
        Chặn
      </button>
    </div>
  );
}
