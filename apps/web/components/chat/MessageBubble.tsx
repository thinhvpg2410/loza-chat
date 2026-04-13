"use client";

import { useState } from "react";
import { FileMessage } from "@/components/chat/FileMessage";
import { ImageMessage } from "@/components/chat/ImageMessage";
import { MessageActions } from "@/components/chat/MessageActions";
import { ReactionBar } from "@/components/chat/ReactionBar";
import { MessageReplyQuote } from "@/components/chat/ReplyPreview";
import { StickerMessage } from "@/components/chat/StickerMessage";
import { groupSpacingClass } from "@/lib/message-grouping";
import type { Message, MessageGroupPosition, MessageReaction } from "@/lib/types/chat";

type MessageBubbleProps = {
  message: Message;
  groupPosition: MessageGroupPosition;
  reactions: MessageReaction[];
  onToggleReaction: (emoji: string) => void;
  onReply: () => void;
  onOpenImage: (url: string) => void;
};

function ownReceiptLabel(message: Message): string | null {
  if (!message.isOwn || message.kind === "system") return null;
  if (message.peerDelivered === undefined && message.peerSeen === undefined) return null;
  if (message.peerSeen) return "Đã xem";
  if (message.peerDelivered) return "Đã nhận";
  return "Đã gửi";
}

function Avatar({ label }: { label: string }) {
  const initial = label.trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7eb6ff] to-[var(--zalo-blue)] text-[11px] font-semibold text-white">
      {initial}
    </div>
  );
}

export function MessageBubble({
  message,
  groupPosition,
  reactions,
  onToggleReaction,
  onReply,
  onOpenImage,
}: MessageBubbleProps) {
  const [hover, setHover] = useState(false);

  if (message.kind === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-black/[0.05] px-3 py-1 text-center text-[11px] text-[var(--zalo-text-muted)]">
          {message.body}
        </span>
      </div>
    );
  }

  const isOwn = message.isOwn;
  const showAvatar = !isOwn && (groupPosition === "last" || groupPosition === "single");
  const spacing = groupSpacingClass(groupPosition);
  const reactionBlock = (
    <ReactionBar
      reactions={reactions}
      onToggle={onToggleReaction}
      alignEnd={isOwn}
    />
  );

  const actionsSlot = (
    <div
      className={`flex shrink-0 items-start pt-0.5 transition-[opacity,width] duration-150 ease-out motion-reduce:transition-none ${
        hover ? "opacity-100" : "pointer-events-none w-0 overflow-hidden opacity-0"
      }`}
    >
      <MessageActions
        visible={hover}
        onReply={onReply}
        onPickReaction={(emoji) => onToggleReaction(emoji)}
      />
    </div>
  );

  const replyQuote = message.replyTo ? <MessageReplyQuote replyTo={message.replyTo} /> : null;

  const timeClass = isOwn ? "text-right text-white/75" : "text-[var(--zalo-text-muted)]";
  const receipt = ownReceiptLabel(message);
  const receiptBlock =
    receipt && isOwn ? (
      <p
        className={`mt-0.5 text-[10px] leading-none ${
          isOwn ? "text-right text-white/70" : "text-[var(--zalo-text-muted)]"
        }`}
      >
        {receipt}
      </p>
    ) : null;

  const body = () => {
    switch (message.kind) {
      case "text":
        return (
          <div
            className={`rounded-lg px-2.5 py-1.5 ${
              isOwn
                ? "rounded-br-sm bg-[var(--zalo-blue)] text-white"
                : "rounded-bl-sm bg-white ring-1 ring-black/[0.06]"
            }`}
          >
            {replyQuote}
            <p
              className={`whitespace-pre-wrap break-words text-[15px] leading-snug ${
                isOwn ? "text-white" : "text-[var(--zalo-text)]"
              }`}
            >
              {message.body}
            </p>
            <p className={`mt-1 text-[10px] leading-none ${timeClass}`}>{message.sentAt}</p>
            {receiptBlock}
          </div>
        );
      case "image":
        return (
          <div className="flex max-w-[min(100%,320px)] flex-col gap-1">
            {replyQuote}
            <div className={`overflow-hidden rounded-lg ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}>
              <ImageMessage
                imageUrl={message.imageUrl}
                alt={message.alt}
                loading={message.loading}
                isOwn={isOwn}
                onOpen={() => onOpenImage(message.imageUrl)}
              />
            </div>
            <p
              className={`text-[10px] ${
                isOwn ? "text-right text-[var(--zalo-text-muted)]" : "text-[var(--zalo-text-muted)]"
              }`}
            >
              {message.sentAt}
            </p>
            {receiptBlock}
          </div>
        );
      case "file":
        return (
          <div className="flex max-w-[min(100%,320px)] flex-col gap-1">
            {replyQuote}
            <div
              className={`rounded-lg px-0.5 py-0.5 ${
                isOwn ? "bg-[var(--zalo-blue)]" : "bg-transparent"
              }`}
            >
              <FileMessage
                fileName={message.fileName}
                fileSizeBytes={message.fileSizeBytes}
                isOwn={isOwn}
                onDownload={
                  message.fileUrl
                    ? () => {
                        window.open(message.fileUrl, "_blank", "noopener,noreferrer");
                      }
                    : undefined
                }
              />
            </div>
            <p className={`text-[10px] ${timeClass}`}>{message.sentAt}</p>
            {receiptBlock}
          </div>
        );
      case "sticker":
        return (
          <div className="flex flex-col">
            <StickerMessage emoji={message.emoji} imageUrl={message.stickerImageUrl} />
            <p
              className={`mt-1 text-[10px] ${
                isOwn ? "text-right text-[var(--zalo-text-muted)]" : "text-[var(--zalo-text-muted)]"
              }`}
            >
              {message.sentAt}
            </p>
            {receiptBlock}
          </div>
        );
      default:
        return null;
    }
  };

  const bubbleColumn = (
    <div
      className={`flex min-w-0 max-w-[min(70%,28rem)] flex-col ${
        message.kind === "sticker" ? (isOwn ? "items-end" : "items-start") : ""
      }`}
    >
      {body()}
      {reactions.length > 0 ? reactionBlock : null}
    </div>
  );

  return (
    <div
      className={`flex gap-1.5 ${spacing} ${isOwn ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {!isOwn ? (
        <div className="flex w-8 shrink-0 flex-col justify-end pb-1">{showAvatar ? <Avatar label="L" /> : null}</div>
      ) : null}

      {/* Tin mình: [actions][bubble][spacer] — actions bên trái bubble, cùng hàng */}
      {isOwn ? actionsSlot : null}

      {bubbleColumn}

      {/* Tin người khác: [avatar][bubble][actions] — actions bên phải bubble, cùng hàng */}
      {!isOwn ? actionsSlot : null}

      {isOwn ? <div className="w-8 shrink-0" aria-hidden /> : null}
    </div>
  );
}
