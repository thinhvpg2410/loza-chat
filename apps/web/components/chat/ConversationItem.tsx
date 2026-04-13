import type { Conversation } from "@/lib/types/chat";
import { Avatar } from "@/components/common/Avatar";

type ConversationItemProps = {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
};

export function ConversationItem({ conversation, isActive, onSelect }: ConversationItemProps) {
  const unread = conversation.unreadCount && conversation.unreadCount > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={
        isActive
          ? "flex w-full gap-2.5 rounded-md bg-[var(--zalo-list-active)] px-2 py-2 text-left transition-colors"
          : "flex w-full gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-black/[0.035]"
      }
    >
      <Avatar
        name={conversation.title}
        size="md"
        src={conversation.avatarUrl}
        online={conversation.isOnline}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14px] font-semibold leading-tight text-[var(--zalo-text)]">
            {conversation.title}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-[var(--zalo-text-muted)]">
            {conversation.lastMessageAt}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[13px] leading-snug text-[var(--zalo-text-muted)]">
            {conversation.isMuted ? (
              <span className="mr-1 inline-block opacity-70" title="Đã tắt thông báo">
                🔕
              </span>
            ) : null}
            {conversation.lastMessagePreview}
          </p>
          {unread ? (
            <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--zalo-blue)] px-1 text-[10px] font-semibold leading-none text-white">
              {conversation.unreadCount! > 99 ? "99+" : conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
