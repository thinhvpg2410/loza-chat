"use client";

import type { Conversation } from "@/lib/types/chat";
import { IconChevronDown, IconMore, IconSidebar } from "@/components/chat/icons";
import { Avatar } from "@/components/common/Avatar";
import { CallHeaderButtons } from "@/components/call/CallHeaderButtons";

type ChatHeaderProps = {
  conversation: Conversation | null;
  statusOverride?: string | null;
  onMoreClick?: () => void;
  viewerDisplayName?: string;
  viewerAvatarUrl?: string | null;
};

export function ChatHeader({
  conversation,
  statusOverride = null,
  onMoreClick,
  viewerDisplayName = "",
  viewerAvatarUrl,
}: ChatHeaderProps) {
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

  const subline = statusOverride?.trim()
    ? { text: statusOverride.trim(), className: "truncate text-[11px] text-[var(--zalo-blue)]" }
    : {
        text: statusLine,
        className: conversation.isOnline
          ? "truncate text-[11px] text-emerald-600"
          : "truncate text-[11px] text-[var(--zalo-text-muted)]",
      };

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

      <Avatar name={conversation.title} size="sm" src={conversation.avatarUrl} />

      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="flex max-w-full items-center gap-0.5 text-left text-[15px] font-semibold text-[var(--zalo-text)]"
        >
          <span className="truncate">{conversation.title}</span>
          <IconChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--zalo-text-muted)]" />
        </button>
        <p className={subline.className}>{subline.text}</p>
      </div>

      <div className="flex shrink-0 items-center gap-0">
        <CallHeaderButtons
          conversation={conversation}
          viewerDisplayName={viewerDisplayName}
          viewerAvatarUrl={viewerAvatarUrl}
        />
        <button
          type="button"
          className="rounded-full p-2 text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-text)]"
          title="Thêm"
          onClick={() => onMoreClick?.()}
        >
          <IconMore className="h-5 w-5" />
          <span className="sr-only">Thêm</span>
        </button>
      </div>
    </header>
  );
}
