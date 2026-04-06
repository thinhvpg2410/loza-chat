"use client";

import { ConversationRow } from "@/components/chat/ConversationRow";
import { IconAdd, IconSearch } from "@/components/chat/icons";
import type { Conversation } from "@/lib/types/chat";

type ConversationListProps = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
}: ConversationListProps) {
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(q) || c.lastMessagePreview.toLowerCase().includes(q),
      )
    : conversations;

  const pinned = filtered.filter((c) => c.isPinned);
  const rest = filtered.filter((c) => !c.isPinned);

  return (
    <section
      className="flex w-[min(100%,var(--zalo-conversation-width))] min-w-[280px] max-w-[360px] shrink-0 flex-col border-r border-[var(--zalo-border)] bg-white"
      aria-label="Danh sách hội thoại"
    >
      <header className="flex items-center gap-2 border-b border-[var(--zalo-border)] px-3 py-2.5">
        <div className="relative min-w-0 flex-1">
          <IconSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--zalo-text-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm"
            className="h-9 w-full rounded-full border border-transparent bg-[var(--zalo-surface)] pl-9 pr-3 text-sm text-[var(--zalo-text)] outline-none ring-[var(--zalo-blue)] placeholder:text-[var(--zalo-text-muted)] focus:border-[var(--zalo-blue)] focus:ring-2"
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06] hover:text-[var(--zalo-text)]"
          title="Tạo nhóm"
        >
          <IconAdd className="h-5 w-5" />
          <span className="sr-only">Tạo nhóm</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {pinned.length > 0 ? (
          <div className="mb-2">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
              Ghim
            </p>
            <div className="flex flex-col gap-0.5">
              {pinned.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  isActive={selectedId === c.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        ) : null}

        {rest.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {rest.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                isActive={selectedId === c.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <p className="px-2 py-8 text-center text-sm text-[var(--zalo-text-muted)]">
            Không tìm thấy hội thoại
          </p>
        )}
      </div>
    </section>
  );
}
