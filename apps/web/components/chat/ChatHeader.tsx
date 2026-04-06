import type { Conversation } from "@/lib/types/chat";
import { IconChevronDown, IconMore, IconPhone, IconSidebar, IconVideo } from "@/components/chat/icons";

type ChatHeaderProps = {
  conversation: Conversation | null;
};

function HeaderAvatar({ title }: { title: string }) {
  const initial = title.trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7eb6ff] to-[var(--zalo-blue)] text-[13px] font-semibold text-white">
      {initial}
    </div>
  );
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  if (!conversation) {
    return (
      <header className="flex h-[52px] shrink-0 items-center border-b border-[var(--zalo-border)] bg-white px-3">
        <p className="text-[13px] text-[var(--zalo-text-muted)]">Chọn một cuộc trò chuyện</p>
      </header>
    );
  }

  const statusLine = conversation.isOnline
    ? "Đang hoạt động"
    : conversation.lastSeenLabel?.trim() || "Không trực tuyến";

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[var(--zalo-border)] bg-white px-2">
      <button
        type="button"
        className="hidden rounded-md p-1.5 text-[var(--zalo-text-muted)] hover:bg-black/[0.04] lg:inline-flex"
        title="Menu"
      >
        <IconSidebar className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </button>
      <HeaderAvatar title={conversation.title} />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="flex max-w-full items-center gap-0.5 text-left text-[15px] font-semibold text-[var(--zalo-text)]"
        >
          <span className="truncate">{conversation.title}</span>
          <IconChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--zalo-text-muted)]" />
        </button>
        <p
          className={
            conversation.isOnline
              ? "truncate text-[11px] text-emerald-600"
              : "truncate text-[11px] text-[var(--zalo-text-muted)]"
          }
        >
          {statusLine}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0">
        <button
          type="button"
          className="rounded-full p-2 text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-blue)]"
          title="Gọi thoại"
        >
          <IconPhone className="h-5 w-5" />
          <span className="sr-only">Gọi thoại</span>
        </button>
        <button
          type="button"
          className="rounded-full p-2 text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-blue)]"
          title="Gọi video"
        >
          <IconVideo className="h-5 w-5" />
          <span className="sr-only">Gọi video</span>
        </button>
        <button
          type="button"
          className="rounded-full p-2 text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-text)]"
          title="Thêm"
        >
          <IconMore className="h-5 w-5" />
          <span className="sr-only">Thêm</span>
        </button>
      </div>
    </header>
  );
}
