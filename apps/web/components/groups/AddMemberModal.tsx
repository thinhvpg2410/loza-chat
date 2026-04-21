"use client";

import { useId, useMemo, useState } from "react";
import { IconClose } from "@/components/chat/icons";
import { Avatar } from "@/components/common/Avatar";
import { SearchInput } from "@/components/common/SearchInput";
import type { Friend } from "@/lib/types/social";

type AddMemberModalProps = {
  open: boolean;
  friends: Friend[];
  /** User ids already in the group (active or pending invite). */
  excludedIds: Set<string>;
  onClose: () => void;
  onSubmit: (memberIds: string[]) => void;
};

export function AddMemberModal({ open, friends, excludedIds, onClose, onSubmit }: AddMemberModalProps) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const candidates = useMemo(
    () => friends.filter((f) => !excludedIds.has(f.id)),
    [friends, excludedIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q),
    );
  }, [candidates, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  if (!open) return null;

  const ids = [...selected];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90dvh,560px)] w-full max-w-[440px] flex-col rounded-lg border border-[var(--zalo-border)] bg-white shadow-lg"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--zalo-border)] px-3 py-2.5">
          <h2 id={titleId} className="text-[15px] font-semibold text-[var(--zalo-text)]">
            Thêm thành viên
          </h2>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06]"
            onClick={onClose}
            title="Đóng"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bạn bè"
          />
          <ul className="mt-2 flex flex-col gap-px">
            {filtered.map((f) => {
              const on = selected.has(f.id);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => toggle(f.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                      on ? "bg-[var(--zalo-list-active)]" : "hover:bg-black/[0.04]"
                    }`}
                  >
                    <input type="checkbox" readOnly className="pointer-events-none" checked={on} />
                    <Avatar name={f.displayName} size="sm" src={f.avatarUrl} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--zalo-text)]">
                      {f.displayName}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-[var(--zalo-text-muted)]">Không còn bạn để thêm.</p>
          ) : null}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--zalo-border)] px-3 py-2.5">
          <button
            type="button"
            className="h-8 rounded-md px-3 text-[13px] font-medium text-[var(--zalo-text)] hover:bg-black/[0.05]"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={ids.length === 0}
            className="h-8 rounded-md bg-[var(--zalo-blue)] px-3 text-[13px] font-semibold text-white disabled:opacity-50"
            onClick={() => onSubmit(ids)}
          >
            Thêm {ids.length > 0 ? `(${ids.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
