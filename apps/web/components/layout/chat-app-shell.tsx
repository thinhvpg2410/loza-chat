import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";

type ChatAppShellProps = {
  children: ReactNode;
};

export function ChatAppShell({ children }: ChatAppShellProps) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
