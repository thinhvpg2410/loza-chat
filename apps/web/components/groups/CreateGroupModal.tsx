"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { IconClose } from "@/components/chat/icons";
import { Avatar } from "@/components/common/Avatar";
import { SearchInput } from "@/components/common/SearchInput";
import { completeChatUploadAction, initChatUploadAction } from "@/features/chat/chat-actions";
import type { Friend } from "@/lib/types/social";

export type CreateGroupPayload = {
  name: string;
  memberIds: string[];
  avatarUrl?: string;
};

type CreateGroupModalProps = {
  open: boolean;
  selectableMembers: Friend[];
  isSubmitting?: boolean;
  submitError?: string | null;
  onClose: () => void;
  onCreate?: (payload: CreateGroupPayload) => void | Promise<void>;
};

async function uploadGroupAvatarFile(file: File): Promise<{ ok: true; publicReadUrl: string } | { ok: false; error: string }> {
  if (!file.type.toLowerCase().startsWith("image/")) {
    return { ok: false, error: "Vui lòng chọn tệp ảnh hợp lệ." };
  }
  const normalizedMime = file.type.trim().toLowerCase() || "image/jpeg";
  const init = await initChatUploadAction({
    fileName: file.name || "group-avatar.jpg",
    mimeType: normalizedMime,
    fileSize: file.size,
    uploadType: "image",
  });
  if (!init.ok) return { ok: false, error: init.error };

  const headers: Record<string, string> = { ...init.uploadHeaders };
  if (init.putBearerToken) {
    headers.Authorization = `Bearer ${init.putBearerToken}`;
  }

  const putRes = await fetch(init.uploadUrl, {
    method: init.uploadMethod,
    headers,
    body: file,
  });
  if (!putRes.ok) {
    return { ok: false, error: `Upload thất bại (${putRes.status}).` };
  }

  const done = await completeChatUploadAction(init.uploadSessionId);
  if (!done.ok) return { ok: false, error: done.error };
  return { ok: true, publicReadUrl: done.publicReadUrl };
}

export function CreateGroupModal({
  open,
  selectableMembers,
  isSubmitting = false,
  submitError = null,
  onClose,
  onCreate,
}: CreateGroupModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting && !uploadingAvatar) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, isSubmitting, uploadingAvatar]);

  useEffect(() => {
    if (!open) {
      setName("");
      setQuery("");
      setSelectedIds([]);
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      setLocalError(null);
      setUploadingAvatar(false);
    }
  }, [open]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

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

  /** Yêu cầu: ít nhất 2 thành viên được chọn (cộng bạn là nhóm ≥3 người). */
  const canCreate = name.trim().length > 0 && selectedIds.length >= 2 && !isSubmitting && !uploadingAvatar;

  const err = submitError ?? localError;

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
            disabled={isSubmitting || uploadingAvatar}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06] disabled:opacity-50"
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
              disabled={isSubmitting || uploadingAvatar}
              className="mt-1 h-9 w-full rounded-md border border-[var(--zalo-border)] bg-white px-2.5 text-[13px] text-[var(--zalo-text)] outline-none focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/25 disabled:opacity-60"
            />
          </label>
          <div className="mt-3 flex items-start gap-3">
            <label className="flex h-14 w-14 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-[var(--zalo-border)] bg-[var(--zalo-surface)] text-[11px] text-[var(--zalo-text-muted)] transition hover:bg-black/[0.03]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isSubmitting || uploadingAvatar}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  setLocalError(null);
                  setAvatarFile(f);
                }}
              />
              {avatarPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={avatarPreviewUrl} className="h-full w-full object-cover" />
              ) : (
                <span className="px-1 text-center leading-tight">Ảnh nhóm</span>
              )}
            </label>
            <div className="min-w-0 flex-1 text-[12px] leading-snug text-[var(--zalo-text-muted)]">
              <p>Ảnh đại diện nhóm (tùy chọn).</p>
              {avatarFile ? (
                <button
                  type="button"
                  className="mt-1 text-[12px] font-medium text-red-600 hover:underline"
                  disabled={isSubmitting || uploadingAvatar}
                  onClick={() => setAvatarFile(null)}
                >
                  Bỏ ảnh
                </button>
              ) : null}
            </div>
          </div>
          {selectedMembers.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={isSubmitting || uploadingAvatar}
                  onClick={() => toggle(m.id)}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-[var(--zalo-list-active)] py-1 pl-2 pr-2 text-[12px] font-medium text-[var(--zalo-text)] transition hover:bg-[#d7e9ff] disabled:opacity-50"
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
              disabled={isSubmitting || uploadingAvatar}
            />
          </div>
          <p className="mt-2 text-[12px] text-[var(--zalo-text-muted)]">
            Chọn ít nhất <span className="font-semibold text-[var(--zalo-text)]">2 thành viên</span> để tạo nhóm.
          </p>
          {err ? (
            <p className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-[12px] text-red-700" role="alert">
              {err}
            </p>
          ) : null}
          <ul className="mt-2 flex flex-col gap-px">
            {filtered.map((f) => {
              const checked = selectedIds.includes(f.id);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    disabled={isSubmitting || uploadingAvatar}
                    onClick={() => toggle(f.id)}
                    className={
                      checked
                        ? "flex w-full items-center gap-2 rounded-md bg-[var(--zalo-list-active)] px-2 py-1.5 text-left disabled:opacity-50"
                        : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-black/[0.035] disabled:opacity-50"
                    }
                  >
                    <Avatar name={f.displayName} size="sm" src={f.avatarUrl} online={f.isOnline} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-[var(--zalo-text)]">
                        {f.displayName}
                      </div>
                      <div className="truncate text-[11px] text-[var(--zalo-text-muted)]">@{f.username}</div>
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
            disabled={isSubmitting || uploadingAvatar}
            className="h-9 rounded-md px-3 text-[13px] font-semibold text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)] disabled:opacity-50"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!canCreate}
            className="h-9 rounded-md bg-[var(--zalo-blue)] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0056d6] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              void (async () => {
                setLocalError(null);
                if (!onCreate) return;
                let avatarUrl: string | undefined;
                if (avatarFile) {
                  setUploadingAvatar(true);
                  const up = await uploadGroupAvatarFile(avatarFile);
                  setUploadingAvatar(false);
                  if (!up.ok) {
                    setLocalError(up.error);
                    return;
                  }
                  avatarUrl = up.publicReadUrl;
                }
                await onCreate({
                  name: name.trim(),
                  memberIds: selectedIds,
                  ...(avatarUrl ? { avatarUrl } : {}),
                });
              })();
            }}
          >
            {uploadingAvatar ? "Đang tải ảnh…" : isSubmitting ? "Đang tạo…" : "Tạo nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
}
