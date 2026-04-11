"use client";

import { useActionState, useState } from "react";
import { OtpSixInput } from "@/components/auth/otp-six-input";
import { Button } from "@/components/ui/button";
import { TermsOfServiceModal } from "@/components/auth/terms-of-service-modal";
import {
  createAccountAction,
  requestRegisterOtpAction,
  verifyRegisterOtpAction,
  type CreateAccountState,
  type RegisterStepState,
} from "@/features/auth/register-actions";

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--zalo-border-soft)] bg-white px-3.5 text-sm text-[var(--zalo-text)] outline-none transition placeholder:text-[var(--zalo-text-subtle)] focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/30";

export function RegisterWizard() {
  const [contact, setContact] = useState("");
  /** Bước 3 — hồ sơ: bắt buộc tick sau khi đọc điều khoản. */
  const [termsRead, setTermsRead] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  /** Remount wizard to reset server action state (e.g. Quay lại). */
  const [wizardKey, setWizardKey] = useState(0);

  const [reqState, reqAction, reqPending] = useActionState(requestRegisterOtpAction, {
    error: null,
  } satisfies RegisterStepState);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyRegisterOtpAction, {
    error: null,
  } satisfies RegisterStepState);
  const [createState, createAction, createPending] = useActionState(createAccountAction, {
    error: null,
  } satisfies CreateAccountState);

  const showOtp = Boolean(reqState.ok);
  const showCreate = Boolean(verifyState.ok);

  return (
    <div key={wizardKey}>
      {!showOtp ? (
        <form action={reqAction} className="flex flex-col gap-5">
          <h2 className="text-center text-base font-semibold text-[var(--zalo-text)]">Bước 1 — Xác thực</h2>
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
      ) : !showCreate ? (
        <form action={verifyAction} className="flex flex-col gap-5">
          <h2 className="text-center text-base font-semibold text-[var(--zalo-text)]">Bước 2 — Nhập OTP</h2>
          <input type="hidden" name="contact" value={contact} />
          <OtpSixInput
            id="register-otp"
            label="Mã OTP (6 số)"
            name="otp"
            disabled={verifyPending}
            inputClassName={inputClass}
          />
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
            onClick={() => {
              setWizardKey((k) => k + 1);
            }}
          >
            ← Quay lại (nhập lại email/SĐT)
          </button>
        </form>
      ) : (
        <form action={createAction} className="flex flex-col gap-5">
          <h2 className="text-center text-base font-semibold text-[var(--zalo-text)]">Bước 3 — Mật khẩu & hồ sơ</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
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
          <div className="flex flex-col gap-2">
            <label htmlFor="displayName" className="text-xs font-medium text-[var(--zalo-text-subtle)]">
              Tên hiển thị
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              maxLength={100}
              placeholder="Tên của bạn"
              className={inputClass}
            />
          </div>
          <div className="flex items-start gap-2.5 text-left text-sm text-[var(--zalo-text)]">
            <input
              id="register-terms-read"
              type="checkbox"
              name="termsRead"
              checked={termsRead}
              onChange={(e) => setTermsRead(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--zalo-border-soft)]"
            />
            <div className="min-w-0 leading-snug">
              <label htmlFor="register-terms-read" className="cursor-pointer">
                Tôi đã đọc{" "}
              </label>
              <button
                type="button"
                className="inline p-0 text-[var(--zalo-blue)] underline decoration-[var(--zalo-blue)]/40 underline-offset-2"
                onClick={() => setTermsModalOpen(true)}
              >
                Điều khoản và dịch vụ
              </button>
              <label htmlFor="register-terms-read" className="cursor-pointer">
                .
              </label>
            </div>
          </div>
          <TermsOfServiceModal open={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
          {createState.error ? (
            <p className="text-sm text-red-600/90" role="alert">
              {createState.error}
            </p>
          ) : null}
          <Button type="submit" disabled={createPending || !termsRead} className="w-full">
            {createPending ? "Đang tạo tài khoản…" : "Hoàn tất đăng ký"}
          </Button>
          <button
            type="button"
            className="text-center text-xs text-[var(--zalo-text-muted)] underline"
            onClick={() => {
              setWizardKey((k) => k + 1);
            }}
          >
            ← Bắt đầu lại từ đầu
          </button>
        </form>
      )}
    </div>
  );
}
