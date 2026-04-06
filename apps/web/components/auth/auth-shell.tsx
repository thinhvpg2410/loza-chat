import type { ReactNode } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/common/app-logo";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showLoginLink?: boolean;
};

export function AuthShell({ title, subtitle, children, showLoginLink = true }: AuthShellProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--zalo-login-page-bg)] px-4 py-10 sm:py-14">
      <div className="mb-8 flex w-full max-w-md flex-col items-center text-center sm:mb-10">
        <div className="mb-5">
          <AppLogo size="lg" />
        </div>
        <h1 className="text-lg font-medium leading-snug text-[var(--zalo-text)] sm:text-xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-[var(--zalo-text-muted)]">{subtitle}</p> : null}
      </div>
      <div className="w-full max-w-[26rem] rounded-xl border border-[var(--zalo-border-soft)] bg-white px-6 pb-8 pt-9 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:px-8">
        {children}
      </div>
      {showLoginLink ? (
        <p className="mt-6 text-center text-sm text-[var(--zalo-text-muted)]">
          <Link href="/login" className="font-medium text-[var(--zalo-blue)] hover:underline">
            Đăng nhập
          </Link>
        </p>
      ) : null}
    </div>
  );
}
