import type { Friend } from "@/lib/types/social";
import { Avatar } from "@/components/common/Avatar";
import { ActionMenu, type ActionMenuItem } from "@/components/common/ActionMenu";

type FriendRowProps = {
  friend: Friend;
  isSelected: boolean;
  onSelect: (id: string) => void;
  /** When true, the “Nhắn tin” row is disabled (direct chat is opening). */
  openingDirectChat?: boolean;
  onMessage?: (id: string) => void;
  source?: "mock" | "api";
  onUnfriend?: (id: string) => void;
  onBlock?: (id: string) => void;
};

export function FriendRow({
  friend,
  isSelected,
  onSelect,
  openingDirectChat = false,
  onMessage,
  source = "mock",
  onUnfriend,
  onBlock,
}: FriendRowProps) {
  const menuItems: ActionMenuItem[] = [
    {
      id: "msg",
      label: openingDirectChat ? "Đang mở…" : "Nhắn tin",
      disabled: openingDirectChat,
      onSelect: () => onMessage?.(friend.id),
    },
    { id: "profile", label: "Xem hồ sơ", onSelect: () => onSelect(friend.id) },
    ...(source === "api" && onUnfriend
      ? ([{ id: "unfriend", label: "Hủy kết bạn", danger: true, onSelect: () => onUnfriend(friend.id) }] as ActionMenuItem[])
      : []),
    ...(source === "api" && onBlock
      ? ([{ id: "block", label: "Chặn", danger: true, onSelect: () => onBlock(friend.id) }] as ActionMenuItem[])
      : []),
  ];

  return (
    <div
      className={
        isSelected
          ? "flex w-full items-center gap-1 rounded-[6px] bg-[rgba(0,104,255,0.055)] px-1.5 py-1.5 transition-colors"
          : "flex w-full items-center gap-1 rounded-[6px] px-1.5 py-1.5 transition-colors hover:bg-black/[0.03]"
      }
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={() => onSelect(friend.id)}
      >
        <Avatar name={friend.displayName} size="contact" online={friend.isOnline} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium leading-[1.25] text-[var(--zalo-text)]">
            {friend.displayName}
          </div>
          <p className="truncate text-[11px] leading-[1.25] text-[var(--zalo-text-subtle)]">
            {friend.status ?? friend.username}
          </p>
        </div>
      </button>
      <ActionMenu items={menuItems} ariaLabel="Thao tác bạn bè" compact />
    </div>
  );
}
