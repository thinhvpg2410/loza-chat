"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { changePasswordAction, type ChangePasswordState } from "@/features/profile/profile-actions";

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--zalo-border-soft)] bg-white px-3.5 text-sm text-[var(--zalo-text)] outline-none transition placeholder:text-[var(--zalo-text-subtle)] focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/30";

type ChangePasswordFormProps = {
  disabled?: boolean;
};

export function ChangePasswordForm({ disabled }: ChangePasswordFormProps) {
  const [state, formAction, pending] = useActionState(changePasswordAction, {
    error: null,
  } satisfies ChangePasswordState);

  if (disabled) {
    return (
      <p className="text-sm text-[var(--zalo-text-muted)]">
        Đăng nhập qua API để đổi mật khẩu tại đây.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="currentPassword" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
          Mật khẩu hiện tại
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="newPassword" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
          Mật khẩu mới
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="confirmNewPassword" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
          Xác nhận mật khẩu mới
        </label>
        <input
          id="confirmNewPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-600/90" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-700" role="status">
          Đã cập nhật mật khẩu.
        </p>
      ) : null}
      <Button type="submit" disabled={pending} size="sm" variant="ghost" className="w-full sm:w-auto">
        {pending ? "Đang lưu…" : "Đổi mật khẩu"}
      </Button>
    </form>
  );
}
