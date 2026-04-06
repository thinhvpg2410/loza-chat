import type { Conversation } from "@/lib/types/chat";

type ConversationItemProps = {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
};

function Avatar({ title, online }: { title: string; online?: boolean }) {
  const initial = title.trim().charAt(0).toUpperCase();
  return (
    <div className="relative shrink-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#7eb6ff] to-[var(--zalo-blue)] text-[13px] font-semibold text-white">
        {initial}
      </div>
      {online ? (
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"
          title="Đang hoạt động"
        />
      ) : null}
    </div>
  );
}

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
      <Avatar title={conversation.title} online={conversation.isOnline} />
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
