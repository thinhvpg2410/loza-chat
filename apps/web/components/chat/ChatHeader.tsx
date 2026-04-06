import type { Conversation } from "@/lib/types/chat";
import { IconChevronDown, IconPhone, IconSidebar, IconVideo } from "@/components/chat/icons";

type ChatHeaderProps = {
  conversation: Conversation | null;
};

function HeaderAvatar({ title }: { title: string }) {
  const initial = title.trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7eb6ff] to-[var(--zalo-blue)] text-sm font-semibold text-white">
      {initial}
    </div>
  );
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  if (!conversation) {
    return (
      <header className="flex h-14 shrink-0 items-center border-b border-[var(--zalo-border)] bg-white px-4">
        <p className="text-sm text-[var(--zalo-text-muted)]">Chọn một cuộc trò chuyện</p>
      </header>
    );
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--zalo-border)] bg-white px-3">
      <button
        type="button"
        className="hidden rounded-lg p-2 text-[var(--zalo-text-muted)] hover:bg-black/[0.04] lg:inline-flex"
        title="Menu"
      >
        <IconSidebar className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </button>
      <HeaderAvatar title={conversation.title} />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="flex max-w-full items-center gap-1 text-left text-[15px] font-semibold text-[var(--zalo-text)]"
        >
          <span className="truncate">{conversation.title}</span>
          <IconChevronDown className="h-4 w-4 shrink-0 text-[var(--zalo-text-muted)]" />
        </button>
        {conversation.isOnline ? (
          <p className="text-xs text-emerald-600">Đang hoạt động</p>
        ) : (
          <p className="text-xs text-[var(--zalo-text-muted)]"> </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          className="rounded-full p-2.5 text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-blue)]"
          title="Gọi thoại"
        >
          <IconPhone className="h-5 w-5" />
          <span className="sr-only">Gọi thoại</span>
        </button>
        <button
          type="button"
          className="rounded-full p-2.5 text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-blue)]"
          title="Gọi video"
        >
          <IconVideo className="h-5 w-5" />
          <span className="sr-only">Gọi video</span>
        </button>
      </div>
    </header>
  );
}
