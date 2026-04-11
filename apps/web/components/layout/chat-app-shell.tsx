"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";

type ChatAppShellProps = {
  children: ReactNode;
};

const VISIBILITY_REFRESH_MS = 5000;

export function ChatAppShell({ children }: ChatAppShellProps) {
  const router = useRouter();
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefreshAtRef.current < VISIBILITY_REFRESH_MS) return;
      lastRefreshAtRef.current = now;
      router.refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [router]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
