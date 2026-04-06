type ProfileActionBarProps = {
  isSelf?: boolean;
  onMessage?: () => void;
  onAddFriend?: () => void;
  onBlock?: () => void;
};

export function ProfileActionBar({ isSelf, onMessage, onAddFriend, onBlock }: ProfileActionBarProps) {
  if (isSelf) {
    return (
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <button
          type="button"
          className="h-9 flex-1 rounded-md border border-[var(--zalo-border)] bg-white text-[13px] font-semibold text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)]"
        >
          Chỉnh sửa hồ sơ
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      <button
        type="button"
        className="h-9 min-w-[96px] flex-1 rounded-md bg-[var(--zalo-blue)] text-[13px] font-semibold text-white transition hover:bg-[#0056d6]"
        onClick={onMessage}
      >
        Nhắn tin
      </button>
      <button
        type="button"
        className="h-9 min-w-[96px] flex-1 rounded-md border border-[var(--zalo-border)] bg-white text-[13px] font-semibold text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)]"
        onClick={onAddFriend}
      >
        Kết bạn
      </button>
      <button
        type="button"
        className="h-9 min-w-[96px] flex-1 rounded-md border border-red-200 bg-white text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
        onClick={onBlock}
      >
        Chặn
      </button>
    </div>
  );
}
