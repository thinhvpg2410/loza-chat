"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "@/features/auth/actions";

const initialState: LoginState = { error: null };

export function ApiLoginForm() {
  const searchParams = useSearchParams();
  const resetDone = searchParams.get("reset") === "1";
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  const inputClass =
    "h-11 w-full rounded-lg border border-[var(--zalo-border-soft)] bg-white px-3.5 text-sm text-[var(--zalo-text)] outline-none transition placeholder:text-[var(--zalo-text-subtle)] focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/30";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {resetDone ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <label htmlFor="identifier" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
          Email hoặc số điện thoại
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="Ví dụ: 0912345678 hoặc email@domain.com"
          className={inputClass}
        />
        <p className="text-[11px] leading-snug text-[var(--zalo-text-subtle)]">
          Số điện thoại có thể nhập dạng 09… — không cần +84. Email vẫn nhập bình thường.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-600/90" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-1 w-full disabled:cursor-not-allowed">
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>
      
    </form>
  );
}
