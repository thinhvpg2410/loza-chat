"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  requestForgotPasswordOtpAction,
  resetForgotPasswordAction,
  verifyForgotPasswordOtpAction,
  type ForgotStepState,
  type ResetPasswordState,
} from "@/features/auth/forgot-password-actions";

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--zalo-border-soft)] bg-white px-3.5 text-sm text-[var(--zalo-text)] outline-none transition placeholder:text-[var(--zalo-text-subtle)] focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/30";

export function ForgotPasswordWizard() {
  const [contact, setContact] = useState("");
  const [wizardKey, setWizardKey] = useState(0);

  const [reqState, reqAction, reqPending] = useActionState(requestForgotPasswordOtpAction, {
    error: null,
  } satisfies ForgotStepState);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyForgotPasswordOtpAction, {
    error: null,
  } satisfies ForgotStepState);
  const [resetState, resetAction, resetPending] = useActionState(resetForgotPasswordAction, {
    error: null,
  } satisfies ResetPasswordState);

  const showOtp = Boolean(reqState.ok);
  const showReset = Boolean(verifyState.ok);

  return (
    <div key={wizardKey}>
      {!showOtp ? (
        <form action={reqAction} className="flex flex-col gap-5">
          <h2 className="text-center text-base font-semibold text-[var(--zalo-text)]">Bước 1 — Tài khoản</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="contact" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
              Email hoặc số điện thoại
            </label>
            <input
              id="contact"
              name="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              autoComplete="username"
              placeholder="email@example.com hoặc 0901234567"
              className={inputClass}
            />
          </div>
          {reqState.error ? (
            <p className="text-sm text-red-600/90" role="alert">
              {reqState.error}
            </p>
          ) : null}
          <Button type="submit" disabled={reqPending} className="w-full">
            {reqPending ? "Đang gửi…" : "Gửi mã OTP"}
          </Button>
        </form>
      ) : !showReset ? (
        <form action={verifyAction} className="flex flex-col gap-5">
          <h2 className="text-center text-base font-semibold text-[var(--zalo-text)]">Bước 2 — Nhập OTP</h2>
          <input type="hidden" name="contact" value={contact} />
          <div className="flex flex-col gap-2">
            <label htmlFor="otp" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
              Mã OTP (6 số)
            </label>
            <input
              id="otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              className={`${inputClass} tracking-[0.2em]`}
            />
          </div>
          {verifyState.error ? (
            <p className="text-sm text-red-600/90" role="alert">
              {verifyState.error}
            </p>
          ) : null}
          <Button type="submit" disabled={verifyPending} className="w-full">
            {verifyPending ? "Đang xác nhận…" : "Xác nhận OTP"}
          </Button>
          <button
            type="button"
            className="text-center text-xs text-[var(--zalo-text-muted)] underline"
            onClick={() => setWizardKey((k) => k + 1)}
          >
            ← Quay lại
          </button>
        </form>
      ) : (
        <form action={resetAction} className="flex flex-col gap-5">
          <h2 className="text-center text-base font-semibold text-[var(--zalo-text)]">Bước 3 — Mật khẩu mới</h2>
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
            <label htmlFor="confirmPassword" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
              Xác nhận mật khẩu
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={inputClass}
            />
          </div>
          {resetState.error ? (
            <p className="text-sm text-red-600/90" role="alert">
              {resetState.error}
            </p>
          ) : null}
          <Button type="submit" disabled={resetPending} className="w-full">
            {resetPending ? "Đang lưu…" : "Đặt lại mật khẩu"}
          </Button>
          <button
            type="button"
            className="text-center text-xs text-[var(--zalo-text-muted)] underline"
            onClick={() => setWizardKey((k) => k + 1)}
          >
            ← Bắt đầu lại
          </button>
        </form>
      )}
    </div>
  );
}
