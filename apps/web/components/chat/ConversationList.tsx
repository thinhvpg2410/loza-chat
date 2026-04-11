"use client";

import { useMemo, useState } from "react";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { IconAdd, IconSearch } from "@/components/chat/icons";
import type { Conversation } from "@/lib/types/chat";

export type ConversationListFilter = "all" | "unread";

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
  const [filter, setFilter] = useState<ConversationListFilter>("all");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = conversations;

    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) || c.lastMessagePreview.toLowerCase().includes(q),
      );
    }

    if (filter === "unread") {
      list = list.filter((c) => (c.unreadCount ?? 0) > 0);
    }

    return list;
  }, [conversations, searchQuery, filter]);

  const pinned = filtered.filter((c) => c.isPinned);
  const rest = filtered.filter((c) => !c.isPinned);

  return (
    <section
      className="flex w-[min(100%,var(--zalo-conversation-width))] min-w-[280px] max-w-[360px] shrink-0 flex-col border-r border-[var(--zalo-border)] bg-[var(--zalo-surface)]"
      aria-label="Danh sách hội thoại"
    >
      <header className="shrink-0 border-b border-[var(--zalo-border)] bg-white px-2.5 pb-2 pt-2.5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <IconSearch
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--zalo-text-muted)]"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm"
              className="h-8 w-full rounded-full border border-transparent bg-[var(--zalo-surface)] pl-8 pr-2.5 text-[13px] text-[var(--zalo-text)] outline-none placeholder:text-[var(--zalo-text-muted)] focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/25"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06] hover:text-[var(--zalo-text)]"
            title="Tạo nhóm"
          >
            <IconAdd className="h-[18px] w-[18px]" />
            <span className="sr-only">Tạo nhóm</span>
          </button>
        </div>
        <div className="mt-2 flex gap-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={
              filter === "all"
                ? "rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-[var(--zalo-blue)] shadow-sm ring-1 ring-black/[0.06]"
                : "rounded-md px-2.5 py-1 text-[12px] font-medium text-[var(--zalo-text-muted)] transition hover:text-[var(--zalo-text)]"
            }
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={
              filter === "unread"
                ? "rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-[var(--zalo-blue)] shadow-sm ring-1 ring-black/[0.06]"
                : "rounded-md px-2.5 py-1 text-[12px] font-medium text-[var(--zalo-text-muted)] transition hover:text-[var(--zalo-text)]"
            }
          >
            Chưa đọc
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
        {pinned.length > 0 ? (
          <div className="mb-1.5">
            <p className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
              Ghim
            </p>
            <div className="flex flex-col gap-px">
              {pinned.map((c) => (
                <ConversationItem
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
          <div className="flex flex-col gap-px">
            {rest.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                isActive={selectedId === c.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <p className="px-2 py-10 text-center text-[13px] text-[var(--zalo-text-muted)]">
            Không có hội thoại phù hợp
          </p>
        )}
      </div>
    </section>
  );
}
