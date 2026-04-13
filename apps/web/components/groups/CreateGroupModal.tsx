"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { IconClose } from "@/components/chat/icons";
import { Avatar } from "@/components/common/Avatar";
import { SearchInput } from "@/components/common/SearchInput";
import type { Friend } from "@/lib/types/social";

type CreateGroupModalProps = {
  open: boolean;
  selectableMembers: Friend[];
  onClose: () => void;
  onCreate?: (payload: { name: string; memberIds: string[] }) => void;
};

export function CreateGroupModal({ open, selectableMembers, onClose, onCreate }: CreateGroupModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return selectableMembers;
    return selectableMembers.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q) ||
        (f.phone && f.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))),
    );
  }, [query, selectableMembers]);

  const selectedMembers = useMemo(
    () => selectableMembers.filter((f) => selectedIds.includes(f.id)),
    [selectableMembers, selectedIds],
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!open) return null;

  const canCreate = name.trim().length > 0 && selectedIds.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90dvh,640px)] w-full max-w-[480px] flex-col rounded-lg border border-[var(--zalo-border)] bg-white shadow-sm"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--zalo-border)] px-3 py-2.5">
          <h2 id={titleId} className="text-[15px] font-semibold text-[var(--zalo-text)]">
            Tạo nhóm
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
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <label className="block">
            <span className="text-[12px] font-medium text-[var(--zalo-text-muted)]">Tên nhóm</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên nhóm"
              className="mt-1 h-9 w-full rounded-md border border-[var(--zalo-border)] bg-white px-2.5 text-[13px] text-[var(--zalo-text)] outline-none focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/25"
            />
          </label>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-[var(--zalo-border)] bg-[var(--zalo-surface)] text-[11px] text-[var(--zalo-text-muted)]">
              Ảnh
            </div>
            <p className="text-[12px] leading-snug text-[var(--zalo-text-muted)]">
              Ảnh đại diện nhóm (tùy chọn). Tính năng upload sẽ nối API sau.
            </p>
          </div>
          {selectedMembers.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-[var(--zalo-list-active)] py-1 pl-2 pr-2 text-[12px] font-medium text-[var(--zalo-text)] transition hover:bg-[#d7e9ff]"
                  title="Bỏ chọn"
                >
                  <span className="truncate">{m.displayName}</span>
                  <span className="text-[var(--zalo-text-muted)]">×</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-3">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm thành viên"
            />
          </div>
          <p className="mt-2 text-[12px] text-[var(--zalo-text-muted)]">Chọn ít nhất một thành viên.</p>
          <ul className="mt-2 flex flex-col gap-px">
            {filtered.map((f) => {
              const checked = selectedIds.includes(f.id);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => toggle(f.id)}
                    className={
                      checked
                        ? "flex w-full items-center gap-2 rounded-md bg-[var(--zalo-list-active)] px-2 py-1.5 text-left"
                        : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-black/[0.035]"
                    }
                  >
                    <Avatar name={f.displayName} size="sm" src={f.avatarUrl} online={f.isOnline} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-[var(--zalo-text)]">
                        {f.displayName}
                      </div>
                      <div className="truncate text-[11px] text-[var(--zalo-text-muted)]">
                        @{f.username}
                      </div>
                    </div>
                    <span
                      className={
                        checked
                          ? "text-[12px] font-semibold text-[var(--zalo-blue)]"
                          : "text-[12px] text-[var(--zalo-text-muted)]"
                      }
                    >
                      {checked ? "Đã chọn" : "Chọn"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--zalo-border)] px-3 py-2.5">
          <button
            type="button"
            className="h-9 rounded-md px-3 text-[13px] font-semibold text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)]"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!canCreate}
            className="h-9 rounded-md bg-[var(--zalo-blue)] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0056d6] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              onCreate?.({ name: name.trim(), memberIds: selectedIds });
              onClose();
            }}
          >
            Tạo nhóm
          </button>
        </div>
      </div>
    </div>
  );
}
