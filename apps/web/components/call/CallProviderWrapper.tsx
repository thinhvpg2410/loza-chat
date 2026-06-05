"use client";

import type { ReactNode } from "react";
import { useChatRealtime } from "@/components/chat/chat-realtime-context";
import { CallProvider } from "@/components/call/call-context";
import { IncomingCallModal } from "@/components/call/IncomingCallModal";
import { CallScreen } from "@/components/call/CallScreen";

export function CallProviderWrapper({ children }: { children: ReactNode }) {
  const realtime = useChatRealtime();

  if (!realtime) return <>{children}</>;

  return (
    <CallProvider
      socketRef={realtime.socketRef}
      socketConnected={realtime.socketConnected}
      viewerUserId={realtime.viewerUserId}
      viewerDisplayName={realtime.viewerDisplayName}
      viewerAvatarUrl={realtime.viewerAvatarUrl}
    >
      {children}
      <IncomingCallModal />
      <CallScreen />
    </CallProvider>
  );
}
