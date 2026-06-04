"use client";

import { useCallback } from "react";
import { IconPhone, IconVideo } from "@/components/chat/icons";
import type { Conversation } from "@/lib/types/chat";
import { useCallSafe } from "@/components/call/call-context";

type Props = {
  conversation: Conversation;
  viewerDisplayName?: string;
  viewerAvatarUrl?: string | null;
};

function generateCallId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `call-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function CallHeaderButtons({ conversation, viewerDisplayName = "", viewerAvatarUrl }: Props) {
  const call = useCallSafe();

  const isGroup =
    conversation.chatType === "group" ||
    (conversation.memberCount != null && conversation.memberCount > 2);

  const inCall = call ? call.callState.phase !== "idle" : false;

  const start = useCallback(
    async (callType: "voice" | "video") => {
      if (!call || inCall) return;
      await call.initiateCall({
        callId: generateCallId(),
        conversationId: conversation.id,
        callType,
        isGroup,
        conversationTitle: conversation.title,
        conversationAvatarUrl: conversation.avatarUrl,
        viewerDisplayName,
        viewerAvatarUrl,
      });
    },
    [call, inCall, conversation, isGroup, viewerDisplayName, viewerAvatarUrl],
  );

  const disabled = !call || inCall;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => void start("voice")}
        className="rounded-full p-2 text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-blue)] disabled:cursor-not-allowed disabled:opacity-40"
        title={isGroup ? "Gọi thoại nhóm" : "Gọi thoại"}
      >
        <IconPhone className="h-5 w-5" />
        <span className="sr-only">Gọi thoại</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => void start("video")}
        className="rounded-full p-2 text-[var(--zalo-text-muted)] transition hover:bg-black/[0.05] hover:text-[var(--zalo-blue)] disabled:cursor-not-allowed disabled:opacity-40"
        title={isGroup ? "Gọi video nhóm" : "Gọi video"}
      >
        <IconVideo className="h-5 w-5" />
        <span className="sr-only">Gọi video</span>
      </button>
    </>
  );
}
