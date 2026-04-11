"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import {
  checkUsernameAvailableAction,
  type AvatarUploadState,
  type ProfileSettingsState,
  updateProfileAction,
  uploadAvatarAction,
} from "@/features/profile/profile-actions";
import { ChangePasswordForm } from "@/features/profile/change-password-form";
import type { ProfileSettingsLoad } from "@/lib/profile/load-profile";
import { USERNAME_FORMAT_MESSAGE, USERNAME_RE } from "@/lib/profile/username";

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--zalo-border-soft)] bg-white px-3.5 text-sm text-[var(--zalo-text)] outline-none transition placeholder:text-[var(--zalo-text-subtle)] focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/30";

type ProfileSettingsFormProps = {
  load: ProfileSettingsLoad;
};

export function ProfileSettingsForm({ load }: ProfileSettingsFormProps) {
  const router = useRouter();
  const { kind, user } = load;
  const isMock = kind === "mock";

  const initialUsername = user.username ?? "";
  const initialBirth = user.birthDate ? user.birthDate.slice(0, 10) : "";

  const [usernameInput, setUsernameInput] = useState(initialUsername);
  const [usernameAvail, setUsernameAvail] = useState<boolean | null>(
    initialUsername ? true : null,
  );

  const [updateState, updateAction, updatePending] = useActionState(updateProfileAction, {
    error: null,
  } satisfies ProfileSettingsState);

  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatarAction, {
    error: null,
  } satisfies AvatarUploadState);

  const savedOnce = useRef(false);
  useEffect(() => {
    if (updateState.ok && !savedOnce.current) {
      savedOnce.current = true;
      router.refresh();
    }
    if (!updateState.ok) {
      savedOnce.current = false;
    }
  }, [updateState.ok, router]);

  useEffect(() => {
    const t = usernameInput.trim();
    if (!t || !USERNAME_RE.test(t) || t === initialUsername.trim()) {
      return;
    }
    let cancelled = false;
    const id = setTimeout(() => {
      void checkUsernameAvailableAction(t).then((ok) => {
        if (!cancelled) setUsernameAvail(ok);
      });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [usernameInput, initialUsername]);

  const usernameFormatError = useMemo(() => {
    const t = usernameInput.trim();
    if (!t) return undefined;
    if (!USERNAME_RE.test(t)) return USERNAME_FORMAT_MESSAGE;
    return undefined;
  }, [usernameInput]);

  const usernameTaken = useMemo(() => {
    const t = usernameInput.trim();
    if (!t || usernameFormatError) return undefined;
    if (t === initialUsername.trim()) return undefined;
    if (usernameAvail === false) return "Username đã được dùng";
    return undefined;
  }, [usernameInput, usernameFormatError, usernameAvail, initialUsername]);

  const usernameCheckPending = useMemo(() => {
    const t = usernameInput.trim();
    if (!t || usernameFormatError) return false;
    if (t === initialUsername.trim()) return false;
    return usernameAvail === null;
  }, [usernameInput, usernameFormatError, usernameAvail, initialUsername]);

  const canSave =
    !usernameFormatError &&
    !usernameTaken &&
    !usernameCheckPending &&
    !updatePending;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
      {isMock ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Chế độ demo: đăng nhập bằng số điện thoại + mật khẩu. Hồ sơ không đồng bộ với máy chủ; nút Lưu chỉ xác nhận giao diện.
        </p>
      ) : null}

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
          Ảnh đại diện
        </h2>
        <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Avatar name={user.displayName} size="lg" src={user.avatarUrl ?? undefined} />
          <form action={avatarAction} className="flex flex-col gap-2">
            <input
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={isMock || avatarPending}
              className="max-w-full text-xs text-[var(--zalo-text-muted)] file:mr-2 file:rounded-md file:border-0 file:bg-[var(--zalo-surface)] file:px-2 file:py-1 file:text-xs file:font-medium file:text-[var(--zalo-text)]"
            />
            <Button type="submit" size="sm" disabled={isMock || avatarPending} variant="ghost">
              {avatarPending ? "Đang tải lên…" : "Cập nhật ảnh"}
            </Button>
            {avatarState.error ? (
              <p className="text-sm text-red-600/90" role="alert">
                {avatarState.error}
              </p>
            ) : null}
            {avatarState.ok ? (
              <p className="text-sm text-emerald-700" role="status">
                Đã cập nhật ảnh đại diện.
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <form key={user.id} action={updateAction} className="flex flex-col gap-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
          Thông tin cá nhân
        </h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="displayName" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
            Tên hiển thị
          </label>
          <input
            id="displayName"
            name="displayName"
            required
            defaultValue={user.displayName}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
            Username (tùy chọn)
          </label>
          <input
            id="username"
            name="username"
            value={usernameInput}
            onChange={(e) => {
              const v = e.target.value.toLowerCase();
              setUsernameInput(v);
              const t = v.trim();
              if (!t) {
                setUsernameAvail(null);
                return;
              }
              if (!USERNAME_RE.test(t)) {
                setUsernameAvail(null);
                return;
              }
              if (t === initialUsername.trim()) {
                setUsernameAvail(true);
                return;
              }
              setUsernameAvail(null);
            }}
            className={inputClass}
            placeholder="vd: thinh_loza"
          />
          {usernameFormatError ? (
            <p className="text-xs text-red-600/90">{usernameFormatError}</p>
          ) : null}
          {usernameTaken ? <p className="text-xs text-red-600/90">{usernameTaken}</p> : null}
          {usernameCheckPending ? (
            <p className="text-xs text-[var(--zalo-text-subtle)]">Đang kiểm tra username…</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="statusMessage" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
            Tiểu sử
          </label>
          <textarea
            id="statusMessage"
            name="statusMessage"
            rows={3}
            defaultValue={user.statusMessage ?? ""}
            className={`${inputClass} min-h-[88px] resize-y py-2`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="birthDate" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
            Ngày sinh
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={initialBirth || undefined}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[var(--zalo-text-subtle)]">Số điện thoại</span>
          <p className="rounded-lg border border-[var(--zalo-border-soft)] bg-[var(--zalo-surface)] px-3.5 py-2.5 text-sm text-[var(--zalo-text-muted)]">
            {user.phoneNumber ?? "—"}
          </p>
          <p className="text-[11px] text-[var(--zalo-text-subtle)]">Số điện thoại không đổi từ trang web.</p>
        </div>

        {updateState.error ? (
          <p className="text-sm text-red-600/90" role="alert">
            {updateState.error}
          </p>
        ) : null}
        {updateState.ok ? (
          <p className="text-sm text-emerald-700" role="status">
            Đã lưu hồ sơ.
          </p>
        ) : null}

        <Button type="submit" disabled={!canSave} className="w-full sm:w-auto">
          {updatePending ? "Đang lưu…" : "Lưu hồ sơ"}
        </Button>
      </form>

      <section className="border-t border-[var(--zalo-border)] pt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
          Bảo mật
        </h2>
        <div className="mt-3">
          <ChangePasswordForm disabled={isMock} />
        </div>
      </section>
    </div>
  );
}
