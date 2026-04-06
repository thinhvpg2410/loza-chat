"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "@/features/auth/actions";

const initialState: LoginState = { error: null };

export function PhoneLoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  const inputClass =
    "h-11 w-full rounded-lg border border-[var(--zalo-border-soft)] bg-white px-3.5 text-sm text-[var(--zalo-text)] outline-none transition placeholder:text-[var(--zalo-text-subtle)] focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/30";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
          Số điện thoại
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Ví dụ: 0912345678"
          className={inputClass}
        />
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
          placeholder="Nhập mật khẩu"
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
      <p className="text-center text-[11px] leading-relaxed text-[var(--zalo-text-subtle)]">
  
      </p>
    </form>
  );
}
