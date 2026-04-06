"use client";

import { useActionState } from "react";
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

export function ApiLoginForm() {
  const searchParams = useSearchParams();
  const resetDone = searchParams.get("reset") === "1";
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
