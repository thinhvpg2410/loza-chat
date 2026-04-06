import type { ReactNode } from "react";
import { ChatAppShell } from "@/components/layout/chat-app-shell";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <ChatAppShell>{children}</ChatAppShell>;
}
