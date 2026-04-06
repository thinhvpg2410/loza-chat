import type { Conversation } from "@/lib/types/chat";

type ConversationRowProps = {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
};

function Avatar({ title, online }: { title: string; online?: boolean }) {
  const initial = title.trim().charAt(0).toUpperCase();
  return (
    <div className="relative shrink-0">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7eb6ff] to-[var(--zalo-blue)] text-sm font-semibold text-white">
        {initial}
      </div>
      {online ? (
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
          title="Đang hoạt động"
        />
      ) : null}
    </div>
  );
}

export function ConversationRow({ conversation, isActive, onSelect }: ConversationRowProps) {
  const unread = conversation.unreadCount && conversation.unreadCount > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={
        isActive
          ? "flex w-full gap-3 rounded-lg bg-[var(--zalo-list-active)] px-3 py-2.5 text-left transition"
          : "flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-black/[0.04]"
      }
    >
      <Avatar title={conversation.title} online={conversation.isOnline} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[15px] font-semibold text-[var(--zalo-text)]">
            {conversation.title}
          </span>
          <span className="shrink-0 text-xs text-[var(--zalo-text-muted)]">{conversation.lastMessageAt}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-[13px] text-[var(--zalo-text-muted)]">
            {conversation.isMuted ? (
              <span className="mr-1 inline-block text-[var(--zalo-text-muted)]" title="Đã tắt thông báo">
                🔕
              </span>
            ) : null}
            {conversation.lastMessagePreview}
          </p>
          {unread ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--zalo-blue)] px-1.5 text-[11px] font-semibold text-white">
              {conversation.unreadCount! > 99 ? "99+" : conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
