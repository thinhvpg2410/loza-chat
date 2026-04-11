"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OtpSixInput } from "@/components/auth/otp-six-input";
import { Button } from "@/components/ui/button";
import {
  cancelDeviceVerificationAction,
  loginAction,
  verifyDeviceLoginAction,
  type LoginState,
  type VerifyDeviceLoginState,
} from "@/features/auth/actions";

const initialLogin: LoginState = { error: null };
const initialVerify: VerifyDeviceLoginState = { error: null };

function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--zalo-text-muted)] outline-none transition hover:bg-black/[0.04] hover:text-[var(--zalo-text)] focus-visible:ring-2 focus-visible:ring-[var(--zalo-blue)]/30"
      aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      {visible ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m12.74 12.74L21 21"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      )}
    </button>
  );
}

export function ApiLoginForm() {
  const searchParams = useSearchParams();
  const resetDone = searchParams.get("reset") === "1";
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialLogin);
  const [verifyState, verifyFormAction, verifyPending] = useActionState(
    verifyDeviceLoginAction,
    initialVerify,
  );

  const inputClass =
    "h-11 w-full rounded-lg border border-[var(--zalo-border-soft)] bg-white px-3.5 text-sm text-[var(--zalo-text)] outline-none transition placeholder:text-[var(--zalo-text-subtle)] focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/30";

  const awaitingOtp = Boolean(loginState.awaitingDeviceOtp);
  const otpChannel = loginState.otpChannel;
  const otpHint =
    otpChannel === "phone"
      ? "Mã đã được gửi tới số điện thoại đăng ký trên tài khoản."
      : otpChannel === "email"
        ? "Mã đã được gửi tới email đăng ký trên tài khoản."
        : "";

  if (awaitingOtp) {
    return (
      <div className="flex flex-col gap-6">
        <p className="rounded-lg border border-[var(--zalo-border-soft)] bg-[var(--zalo-surface)] px-3 py-2 text-sm text-[var(--zalo-text)]">
          Thiết bị này chưa được tin cậy. Nhập mã 6 số để hoàn tất đăng nhập.
        </p>
        <form action={verifyFormAction} className="flex flex-col gap-5">
          <OtpSixInput
            id="device-login-otp"
            label="Mã xác thực"
            hint={otpHint}
            disabled={verifyPending}
            inputClassName={inputClass}
          />
          {verifyState.error ? (
            <p className="text-sm text-red-600/90" role="alert">
              {verifyState.error}
            </p>
          ) : null}
          <Button type="submit" disabled={verifyPending} className="w-full disabled:cursor-not-allowed">
            {verifyPending ? "Đang xác nhận…" : "Xác nhận và đăng nhập"}
          </Button>
        </form>
        <form action={cancelDeviceVerificationAction}>
          <button
            type="submit"
            className="w-full text-center text-xs text-[var(--zalo-text-muted)] underline"
          >
            ← Quay lại đăng nhập
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={loginFormAction} className="flex flex-col gap-6">
      {resetDone ? (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
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
          placeholder=""
          className={inputClass}
        />
    
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            className={`${inputClass} pr-11`}
          />
          <PasswordVisibilityToggle
            visible={passwordVisible}
            onToggle={() => setPasswordVisible((v) => !v)}
          />
        </div>
      </div>
      {loginState.error ? (
        <p className="text-sm text-red-600/90" role="alert">
          {loginState.error}
        </p>
      ) : null}
      <Button type="submit" disabled={loginPending} className="mt-1 w-full disabled:cursor-not-allowed">
        {loginPending ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>
    </form>
  );
}
