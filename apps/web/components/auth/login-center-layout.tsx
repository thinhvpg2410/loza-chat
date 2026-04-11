"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { AppLogo } from "@/components/common/app-logo";
import { IconPhone, IconQrCode } from "@/components/chat/icons";
import { ApiLoginForm } from "@/features/auth/api-login-form";
import { PhoneLoginForm } from "@/features/auth/phone-login-form";
import { QrLoginPanel } from "@/features/auth/qr-login-panel";

type LoginMode = "qr" | "account";

type LoginCenterLayoutProps = {
  apiEnabled: boolean;
};

export function LoginCenterLayout({ apiEnabled }: LoginCenterLayoutProps) {
  const [mode, setMode] = useState<LoginMode>(() => (apiEnabled ? "account" : "qr"));

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--zalo-login-page-bg)] px-4 py-10 sm:py-14">
      <div className="mb-8 flex w-full max-w-md flex-col items-center text-center sm:mb-10">
        <div className="mb-5">
          <AppLogo size="lg" />
        </div>
        <h1 className="text-lg font-medium leading-snug text-[var(--zalo-text)] sm:text-xl">
          Đăng nhập tài khoản Loza Chat
        </h1>
        <p className="mt-2 text-sm text-[var(--zalo-text-muted)]">để kết nối với ứng dụng Loza Chat Web</p>
      </div>

      <div className="relative w-full max-w-[26rem] rounded-xl border border-[var(--zalo-border-soft)] bg-white px-6 pb-8 pt-9 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:px-8">
        <button
          type="button"
          onClick={() => setMode((m) => (m === "qr" ? "account" : "qr"))}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-md text-[var(--zalo-text-muted)] transition hover:bg-[var(--zalo-surface)] hover:text-[var(--zalo-text)]"
          title={mode === "qr" ? "Đăng nhập bằng tài khoản" : "Đăng nhập bằng mã QR"}
          aria-label={mode === "qr" ? "Đăng nhập bằng tài khoản" : "Đăng nhập bằng mã QR"}
        >
          {mode === "qr" ? (
            <IconPhone className="h-5 w-5" aria-hidden />
          ) : (
            <IconQrCode className="h-5 w-5" aria-hidden />
          )}
        </button>

        {mode === "qr" ? (
          apiEnabled ? (
            <QrLoginPanel />
          ) : (
            <div className="flex flex-col items-center">
              <h2 className="mb-6 text-center text-base font-semibold text-[var(--zalo-text)]">
                Đăng nhập qua mã QR
              </h2>
              <div
                className="flex h-56 w-56 items-center justify-center rounded-lg border border-[var(--zalo-border-soft)] bg-white sm:h-60 sm:w-60"
                aria-hidden
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="grid h-32 w-32 grid-cols-6 gap-px opacity-[0.35]">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <span
                        key={i}
                        className={`rounded-[1px] ${i % 7 === 0 || i % 11 === 0 ? "bg-[var(--zalo-text)]" : "bg-transparent"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-[var(--zalo-text-subtle)]">Mã QR</span>
                </div>
              </div>
              <p className="mt-6 max-w-xs text-center text-xs leading-relaxed text-[var(--zalo-text-muted)]">
                Bật API (LOZA_API_BASE_URL) để đăng nhập web bằng mã QR từ ứng dụng di động.
              </p>
              <p className="mt-3 text-center text-[11px] text-[var(--zalo-text-subtle)]">
                Chỉ dùng để đăng nhập Loza Chat trên máy tính.
              </p>
            </div>
          )
        ) : apiEnabled ? (
          <div>
            <h2 className="mb-6 pr-10 text-center text-base font-semibold text-[var(--zalo-text)]">
              Đăng nhập bằng mật khẩu
            </h2>
            <Suspense
              fallback={
                <div className="flex h-40 items-center justify-center text-sm text-[var(--zalo-text-muted)]">
                  Đang tải…
                </div>
              }
            >
              <ApiLoginForm />
            </Suspense>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[var(--zalo-text-muted)]">
              <Link href="/register" className="font-medium text-[var(--zalo-blue)] hover:underline">
                Đăng ký
              </Link>
              <span className="text-[var(--zalo-border-soft)]" aria-hidden>
                ·
              </span>
              <Link href="/forgot-password" className="font-medium text-[var(--zalo-blue)] hover:underline">
                Quên mật khẩu
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="mb-6 pr-10 text-center text-base font-semibold text-[var(--zalo-text)]">
              Đăng nhập bằng số điện thoại
            </h2>
            <PhoneLoginForm />
          </div>
        )}
      </div>
    </div>
  );
}
