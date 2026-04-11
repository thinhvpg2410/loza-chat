"use client";

import { logoutAction } from "@/features/auth/actions";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex h-10 w-10 items-center justify-center rounded-md text-xs font-semibold text-white/90 transition hover:bg-white/10"
        title="Sign out"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[11px] text-white">
          You
        </span>
        <span className="sr-only">Sign out</span>
      </button>
    </form>
  );
}
