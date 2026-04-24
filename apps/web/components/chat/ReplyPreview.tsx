import type { ReplyPreviewRef } from "@/lib/types/chat";
import { IconClose } from "@/components/chat/icons";

/** Nền phía sau dải trích dẫn — quyết định palette chữ (không dùng `replyTo.isOwn` một mình). */
export type MessageReplyQuoteSurface = "tinted" | "card" | "plain";

/** Quote strip inside a message bubble (reply thread). */
export function MessageReplyQuote({
  replyTo,
  surface,
}: {
  replyTo: ReplyPreviewRef;
  surface: MessageReplyQuoteSurface;
}) {
  const quotedSelf = replyTo.isOwn;
  const onTinted = surface === "tinted";
  const borderClass = onTinted
    ? quotedSelf
      ? "border-white/50"
      : "border-white/40"
    : "border-[var(--zalo-blue)]";
  const nameClass = onTinted
    ? "text-white/95"
    : quotedSelf
      ? "text-[var(--zalo-blue)]"
      : "text-[#0052cc]";
  const snippetClass = onTinted ? "text-white/82" : "text-[#4a5568]";

  return (
    <div className={`mb-1.5 border-l-[3px] pl-2 text-left ${borderClass}`}>
      <p className={`text-[11px] font-semibold ${nameClass}`}>
        {replyTo.isOwn ? "Bạn" : replyTo.peerSenderName?.trim() || "Người gửi"}
      </p>
      <p className={`line-clamp-2 text-[12px] leading-snug ${snippetClass}`}>{replyTo.snippet}</p>
    </div>
  );
}

/** Compact reply preview above the composer. */
export function ReplyPreviewBar({
  replyTo,
  onCancel,
}: {
  replyTo: ReplyPreviewRef;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-start gap-2 border-b border-[var(--zalo-border)] bg-[var(--zalo-surface)] px-3 py-2">
      <div className="min-w-0 flex-1 border-l-[3px] border-[var(--zalo-blue)] pl-2">
        <p className="text-[11px] font-semibold text-[var(--zalo-blue)]">
          Trả lời{" "}
          {replyTo.isOwn ? "chính bạn" : replyTo.peerSenderName?.trim() || "tin nhắn"}
        </p>
        <p className="line-clamp-2 text-[12px] text-[var(--zalo-text-muted)]">{replyTo.snippet}</p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 rounded-md p-1 text-[var(--zalo-text-muted)] hover:bg-black/[0.06] hover:text-[var(--zalo-text)]"
        title="Hủy"
      >
        <IconClose className="h-4 w-4" />
      </button>
    </div>
  );
}
