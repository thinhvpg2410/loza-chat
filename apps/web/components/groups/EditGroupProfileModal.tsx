"use client";

import { useEffect, useId, useState } from "react";
import { IconClose } from "@/components/chat/icons";
import { Avatar } from "@/components/common/Avatar";
import { uploadGroupAvatarFile } from "@/lib/chat/upload-group-avatar-file";

export type EditGroupProfileModalProps = {
  open: boolean;
  initialTitle: string;
  initialAvatarUrl?: string | null;
  canEditTitle: boolean;
  canEditAvatar: boolean;
  isSubmitting?: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSave: (patch: { title?: string; avatarUrl?: string | null }) => void | Promise<void>;
};

export function EditGroupProfileModal({
  open,
  initialTitle,
  initialAvatarUrl,
  canEditTitle,
  canEditAvatar,
  isSubmitting = false,
  submitError = null,
  onClose,
  onSave,
}: EditGroupProfileModalProps) {
  const titleId = useId();
  const [title, setTitle] = useState(initialTitle);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
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
      setTitle(initialTitle);
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      setRemoveAvatar(false);
      setLocalError(null);
      setUploadingAvatar(false);
      return;
    }
    setTitle(initialTitle);
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setRemoveAvatar(false);
    setLocalError(null);
  }, [open, initialTitle]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  if (!open) return null;

  const titleTrim = title.trim();
  const titleChanged = canEditTitle && titleTrim.length > 0 && titleTrim !== initialTitle.trim();
  const avatarDirty = canEditAvatar && (avatarFile !== null || removeAvatar);
  const canSave =
    (titleChanged || avatarDirty) && (!canEditTitle || titleTrim.length > 0) && !isSubmitting && !uploadingAvatar;

  const err = submitError ?? localError;
  const previewForAvatar = removeAvatar ? null : avatarPreviewUrl ?? initialAvatarUrl ?? undefined;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/35 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-[400px] flex-col rounded-lg border border-[var(--zalo-border)] bg-white shadow-sm"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--zalo-border)] px-3 py-2.5">
          <h2 id={titleId} className="text-[15px] font-semibold text-[var(--zalo-text)]">
            Chỉnh sửa nhóm
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
        <div className="px-3 py-3">
          {canEditTitle ? (
            <label className="block">
              <span className="text-[12px] font-medium text-[var(--zalo-text-muted)]">Tên nhóm</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên nhóm"
                maxLength={120}
                disabled={isSubmitting || uploadingAvatar}
                className="mt-1 h-9 w-full rounded-md border border-[var(--zalo-border)] bg-white px-2.5 text-[13px] text-[var(--zalo-text)] outline-none focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/25 disabled:opacity-60"
              />
            </label>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-[var(--zalo-border)]/60 bg-[var(--zalo-surface)] px-2 py-2">
              <Avatar name={initialTitle} size="sm" src={initialAvatarUrl ?? undefined} />
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--zalo-text)]">{initialTitle}</p>
            </div>
          )}

          {canEditAvatar ? (
            <div className="mt-4">
              <p className="text-[12px] font-medium text-[var(--zalo-text-muted)]">Ảnh đại diện nhóm</p>
              <div className="mt-2 flex items-start gap-3">
                <label className="flex h-16 w-16 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border border-dashed border-[var(--zalo-border)] bg-[var(--zalo-surface)] text-[10px] text-[var(--zalo-text-muted)] transition hover:bg-black/[0.03]">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isSubmitting || uploadingAvatar}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      e.target.value = "";
                      setLocalError(null);
                      setRemoveAvatar(false);
                      setAvatarFile(f);
                    }}
                  />
                  {previewForAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" src={previewForAvatar} className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-1 text-center leading-tight">Chọn ảnh</span>
                  )}
                </label>
                <div className="min-w-0 flex-1 text-[12px] leading-snug text-[var(--zalo-text-muted)]">
                  <p>Ảnh hiển thị trong danh sách chat và thông tin nhóm.</p>
                  {initialAvatarUrl && !avatarFile ? (
                    <button
                      type="button"
                      className="mt-1.5 text-[12px] font-medium text-red-600 hover:underline disabled:opacity-50"
                      disabled={isSubmitting || uploadingAvatar || removeAvatar}
                      onClick={() => {
                        setLocalError(null);
                        setAvatarFile(null);
                        setRemoveAvatar(true);
                      }}
                    >
                      Xóa ảnh hiện tại
                    </button>
                  ) : null}
                  {avatarFile ? (
                    <button
                      type="button"
                      className="mt-1 text-[12px] font-medium text-red-600 hover:underline"
                      disabled={isSubmitting || uploadingAvatar}
                      onClick={() => {
                        setAvatarFile(null);
                        setRemoveAvatar(false);
                      }}
                    >
                      Bỏ ảnh mới
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          {err ? (
            <p className="mt-3 rounded-md bg-red-50 px-2 py-1.5 text-[12px] text-red-700" role="alert">
              {err}
            </p>
          ) : null}
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
            disabled={!canSave}
            className="h-9 rounded-md bg-[var(--zalo-blue)] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0056d6] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              void (async () => {
                setLocalError(null);
                const patch: { title?: string; avatarUrl?: string | null } = {};
                if (titleChanged) {
                  patch.title = titleTrim;
                }
                if (canEditAvatar) {
                  if (avatarFile) {
                    setUploadingAvatar(true);
                    const up = await uploadGroupAvatarFile(avatarFile);
                    setUploadingAvatar(false);
                    if (!up.ok) {
                      setLocalError(up.error);
                      return;
                    }
                    patch.avatarUrl = up.publicReadUrl;
                  } else if (removeAvatar) {
                    patch.avatarUrl = "";
                  }
                }
                if (Object.keys(patch).length === 0) return;
                await onSave(patch);
              })();
            }}
          >
            {uploadingAvatar ? "Đang tải ảnh…" : isSubmitting ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
