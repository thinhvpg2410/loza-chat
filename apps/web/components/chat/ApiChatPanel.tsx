"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ForwardMessageDialog } from "@/components/chat/ForwardMessageDialog";
import { useChatRealtime } from "@/components/chat/chat-realtime-context";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { DocumentPreviewModal } from "@/components/chat/DocumentPreviewModal";
import { ImagePreviewModal } from "@/components/chat/ImagePreviewModal";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import {
  completeChatUploadAction,
  deleteChatMessageAction,
  fetchConversationMessagesAction,
  addChatMessageReactionAction,
  fetchConversationsListAction,
  forwardChatMessageAction,
  initChatUploadAction,
  markConversationReadAction,
  recallChatMessageAction,
  removeChatMessageReactionAction,
  sendChatMessageWithAttachmentsAction,
  sendChatStickerMessageAction,
  sendChatTextMessageAction,
} from "@/features/chat/chat-actions";
import {
  applyPeerReceiptPointersToMessages,
  initialPeerReceiptMaxFromMessages,
  mergeReceiptPointerFromSocketPayload,
} from "@/lib/chat/apply-peer-receipts";
import type { ApiMessageWithReceipt } from "@/lib/chat/api-dtos";
import { mapReactions, mapSingleApiMessage } from "@/lib/chat/map-api-message";
import { maxMessageTimelineRefIso, type MessageTimelineRef } from "@/lib/chat/message-timeline";
import { messageSnippet } from "@/lib/message-snippet";
import { mergeReactionBroadcastCounts } from "@/lib/reaction-utils";
import type { Conversation, Message, MessageReaction, ReplyPreviewRef } from "@/lib/types/chat";

type ApiChatPanelProps = {
  conversation: Conversation | null;
  onConversationsRefresh?: (conversations: Conversation[]) => void;
};

type ConfirmActionState =
  | {
      kind: "recall" | "delete";
      messageId: string;
      title: string;
      description: string;
      confirmLabel: string;
      variant: "default" | "danger";
    }
  | null;

function buildClientMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Distance from bottom of scroll container; used to keep chat "stuck" to latest. */
function isScrollNearBottom(element: HTMLDivElement, thresholdPx = 160): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= thresholdPx;
}

function shouldFollowIncomingMessage(
  el: HTMLDivElement | null,
  sentByViewer: boolean,
  followTailRef: { current: boolean },
): boolean {
  if (sentByViewer) return true;
  if (followTailRef.current) return true;
  return !el || isScrollNearBottom(el);
}

type ScrollToEndAfterPaint = "none" | "smooth" | "auto";

export function ApiChatPanel({ conversation, onConversationsRefresh }: ApiChatPanelProps) {
  const realtime = useChatRealtime();
  const realtimeRef = useRef(realtime);
  useEffect(() => {
    realtimeRef.current = realtime;
  }, [realtime]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadOlderLoading, setLoadOlderLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [reactionOverrides, setReactionOverrides] = useState<Record<string, MessageReaction[]>>({});
  const reactionOverridesRef = useRef<Record<string, MessageReaction[]>>({});
  const reactionBusyRef = useRef<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<{
    embedUrl: string;
    title: string;
    downloadUrl: string;
  } | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ convId: string; message: Message } | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLabel, setUploadingLabel] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState>(null);
  const [messageActionBusy, setMessageActionBusy] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardSourceMessageId, setForwardSourceMessageId] = useState<string | null>(null);
  const [forwardOptions, setForwardOptions] = useState<Conversation[]>([]);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardError, setForwardError] = useState<string | null>(null);
  const [forwardBusyConversationId, setForwardBusyConversationId] = useState<string | null>(null);

  const messageScrollRef = useRef<HTMLDivElement>(null);
  /** User is viewing the latest messages (or we have not received a scroll event yet). */
  const nearBottomRef = useRef(true);
  const scrollToEndAfterPaintRef = useRef<ScrollToEndAfterPaint>("none");
  const messagesRef = useRef<Message[]>([]);
  const peerDeliveredMaxRef = useRef<MessageTimelineRef | null>(null);
  const peerReadMaxRef = useRef<MessageTimelineRef | null>(null);
  const typingStartedRef = useRef(false);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerTypingExpireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imagePickerRef = useRef<HTMLInputElement>(null);
  const filePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    reactionOverridesRef.current = reactionOverrides;
  }, [reactionOverrides]);

  const applyReceipts = useCallback((list: Message[]) => {
    return applyPeerReceiptPointersToMessages(
      list,
      peerDeliveredMaxRef.current,
      peerReadMaxRef.current,
    );
  }, []);

  const flushTypingStop = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (typingStartedRef.current && realtime && conversation) {
      typingStartedRef.current = false;
      realtime.stopTyping(conversation.id);
    }
  }, [realtime, conversation]);

  const schedulePeerTypingExpire = useCallback(() => {
    if (peerTypingExpireTimerRef.current) {
      clearTimeout(peerTypingExpireTimerRef.current);
    }
    peerTypingExpireTimerRef.current = setTimeout(() => {
      setPeerTyping(false);
      peerTypingExpireTimerRef.current = null;
    }, 12_000);
  }, []);

  useEffect(() => {
    if (realtime?.socketConnected) return;
    setPeerTyping(false);
    if (peerTypingExpireTimerRef.current) {
      clearTimeout(peerTypingExpireTimerRef.current);
      peerTypingExpireTimerRef.current = null;
    }
  }, [realtime?.socketConnected]);

  const notifyTypingActivity = useCallback(() => {
    if (!realtime?.socketConnected || !conversation) return;
    if (conversation.chatType === "direct") {
      const rel = conversation.directPeerRelationshipStatus;
      if (rel === "blocked_by_me" || rel === "blocked_me") return;
    }
    if (!typingStartedRef.current) {
      typingStartedRef.current = true;
      realtime.startTyping(conversation.id);
    }
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      typingStopTimerRef.current = null;
      if (typingStartedRef.current && realtime && conversation) {
        typingStartedRef.current = false;
        realtime.stopTyping(conversation.id);
      }
    }, 2200);
  }, [realtime, conversation]);

  /** Re-send typing:start while composing so peers keep seeing “đang nhập” (server + local TTL). */
  useEffect(() => {
    if (!conversation) return;
    if (!realtime?.socketConnected) return;
    if (conversation.chatType === "direct") {
      const rel = conversation.directPeerRelationshipStatus;
      if (rel === "blocked_by_me" || rel === "blocked_me") return;
    }
    if (!draft.trim()) return;
    const convId = conversation.id;
    const id = window.setInterval(() => {
      realtimeRef.current?.startTyping(convId);
    }, 8000);
    return () => clearInterval(id);
  }, [conversation, draft, realtime?.socketConnected]);

  useEffect(() => {
    if (!conversation) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
      typingStartedRef.current = false;

      nearBottomRef.current = true;
      scrollToEndAfterPaintRef.current = "none";

      setLoading(true);
      setLoadError(null);
      setSendError(null);
      setMessages([]);
      setNextCursor(null);
      setPeerTyping(false);
      if (peerTypingExpireTimerRef.current) {
        clearTimeout(peerTypingExpireTimerRef.current);
        peerTypingExpireTimerRef.current = null;
      }
      peerDeliveredMaxRef.current = null;
      peerReadMaxRef.current = null;

      void fetchConversationMessagesAction(conversation.id).then((r) => {
        if (cancelled) return;
        setLoading(false);
        if (!r.ok) {
          setLoadError(r.error);
          return;
        }
        const initial = initialPeerReceiptMaxFromMessages(r.messages);
        peerDeliveredMaxRef.current = initial.peerDeliveredMax;
        peerReadMaxRef.current = initial.peerReadMax;
        const stamped = applyPeerReceiptPointersToMessages(
          r.messages,
          peerDeliveredMaxRef.current,
          peerReadMaxRef.current,
        );
        setMessages(stamped);
        setNextCursor(r.nextCursor);
        if (stamped.length > 0) {
          scrollToEndAfterPaintRef.current = "auto";
        }
        const last = stamped[stamped.length - 1];
        if (last) {
          void markConversationReadAction(conversation.id, last.id);
          realtimeRef.current?.emitSeen(conversation.id, last.id);
          if (!last.isOwn) {
            realtimeRef.current?.emitDelivered(conversation.id, last.id);
          }
        }
      });
    });

    return () => {
      cancelled = true;
      if (typingStartedRef.current) {
        typingStartedRef.current = false;
        realtimeRef.current?.stopTyping(conversation.id);
      }
      if (peerTypingExpireTimerRef.current) {
        clearTimeout(peerTypingExpireTimerRef.current);
        peerTypingExpireTimerRef.current = null;
      }
    };
  }, [conversation]);

  useEffect(() => {
    if (!conversation || !realtime?.viewerUserId) return;
    const convId = conversation.id;
    const apiBase = realtime.apiBaseUrl;

    return realtime.registerRoom(convId, {
      onMessageNew: (row: ApiMessageWithReceipt) => {
        const el = messageScrollRef.current;
        if (shouldFollowIncomingMessage(el, row.sentByViewer, nearBottomRef)) {
          scrollToEndAfterPaintRef.current = "smooth";
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === row.id)) return prev;
          const mapped = mapSingleApiMessage(row, apiBase);
          const next = applyReceipts([...prev, mapped]);
          return next;
        });
        if (!row.sentByViewer) {
          void markConversationReadAction(convId, row.id);
          realtime.emitDelivered(convId, row.id);
          realtime.emitSeen(convId, row.id);
        }
      },
      onMessageUpdated: (row: ApiMessageWithReceipt) => {
        setMessages((prev) => {
          const mapped = mapSingleApiMessage(row, apiBase);
          if (!prev.some((m) => m.id === row.id)) return prev;
          return applyReceipts(prev.map((m) => (m.id === row.id ? mapped : m)));
        });
      },
      onTypingUpdate: ({ userId, isTyping }) => {
        if (userId === realtime.viewerUserId) return;
        setPeerTyping(isTyping);
        if (isTyping) {
          schedulePeerTypingExpire();
        } else if (peerTypingExpireTimerRef.current) {
          clearTimeout(peerTypingExpireTimerRef.current);
          peerTypingExpireTimerRef.current = null;
        }
      },
      onReceipt: (kind, p) => {
        if (p.userId === realtime.viewerUserId) return;
        if (p.conversationId !== convId) return;
        const snapshot = messagesRef.current;
        if (kind === "delivered") {
          peerDeliveredMaxRef.current = mergeReceiptPointerFromSocketPayload(
            peerDeliveredMaxRef.current,
            p,
            snapshot,
          );
        } else {
          peerReadMaxRef.current = mergeReceiptPointerFromSocketPayload(
            peerReadMaxRef.current,
            p,
            snapshot,
          );
        }
        setMessages((prev) =>
          applyPeerReceiptPointersToMessages(
            prev,
            peerDeliveredMaxRef.current,
            peerReadMaxRef.current,
          ),
        );
      },
      onReactionUpdated: (payload) => {
        if (payload.conversationId !== convId) return;
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== payload.messageId) return m;
            const prevRx =
              reactionOverridesRef.current[payload.messageId] ?? m.reactions ?? [];
            return {
              ...m,
              reactions: mergeReactionBroadcastCounts(prevRx, payload.summary),
            };
          }),
        );
        setReactionOverrides((o) => {
          if (!(payload.messageId in o)) return o;
          const { [payload.messageId]: _, ...rest } = o;
          return rest;
        });
      },
    });
  }, [conversation, realtime, applyReceipts, schedulePeerTypingExpire]);

  useEffect(() => {
    if (!conversation || !realtime?.socketConnected) return;
    let cancelled = false;
    void fetchConversationMessagesAction(conversation.id).then((r) => {
      if (cancelled || !r.ok) return;
      const el = messageScrollRef.current;
      if (el && (nearBottomRef.current || isScrollNearBottom(el))) {
        scrollToEndAfterPaintRef.current = "auto";
      }
      setMessages((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]));
        for (const next of r.messages) {
          byId.set(next.id, next);
        }
        const merged = [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const receipts = initialPeerReceiptMaxFromMessages(merged);
        peerDeliveredMaxRef.current = maxMessageTimelineRefIso(
          peerDeliveredMaxRef.current,
          receipts.peerDeliveredMax,
        );
        peerReadMaxRef.current = maxMessageTimelineRefIso(peerReadMaxRef.current, receipts.peerReadMax);
        return applyReceipts(merged);
      });
      setNextCursor(r.nextCursor);
      const last = r.messages[r.messages.length - 1];
      if (last && !last.isOwn) {
        void markConversationReadAction(conversation.id, last.id);
        realtimeRef.current?.emitDelivered(conversation.id, last.id);
        realtimeRef.current?.emitSeen(conversation.id, last.id);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [conversation, realtime?.socketConnected, applyReceipts]);

  const loadOlder = useCallback(async () => {
    if (!conversation || !nextCursor || loadOlderLoading) return;
    setLoadOlderLoading(true);
    const r = await fetchConversationMessagesAction(conversation.id, nextCursor);
    setLoadOlderLoading(false);
    if (!r.ok) return;
    const merged = [...r.messages, ...messagesRef.current];
    const initial = initialPeerReceiptMaxFromMessages(merged);
    peerDeliveredMaxRef.current = maxMessageTimelineRefIso(
      peerDeliveredMaxRef.current,
      initial.peerDeliveredMax,
    );
    peerReadMaxRef.current = maxMessageTimelineRefIso(peerReadMaxRef.current, initial.peerReadMax);
    setMessages(
      applyPeerReceiptPointersToMessages(merged, peerDeliveredMaxRef.current, peerReadMaxRef.current),
    );
    setNextCursor(r.nextCursor);
  }, [conversation, nextCursor, loadOlderLoading]);

  const refreshSidebar = useCallback(async () => {
    if (!onConversationsRefresh) return;
    const r = await fetchConversationsListAction();
    if (r.ok) onConversationsRefresh(r.conversations);
  }, [onConversationsRefresh]);

  const applyServerReactionSummary = useCallback((messageId: string, summary: ApiMessageWithReceipt["reactions"]) => {
    const rx = mapReactions(summary);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: rx } : m)));
    setReactionOverrides((o) => {
      if (!(messageId in o)) return o;
      const { [messageId]: _, ...rest } = o;
      return rest;
    });
  }, []);

  const onToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!conversation) return;
      const msg = messagesRef.current.find((m) => m.id === messageId);
      if (!msg || msg.kind === "system") return;
      if (reactionBusyRef.current.has(messageId)) return;
      reactionBusyRef.current.add(messageId);
      setSendError(null);
      try {
        const effective = reactionOverridesRef.current[messageId] ?? msg.reactions ?? [];
        const mine = effective.filter((r) => r.viewerReacted).map((r) => r.emoji);
        const isMine = effective.some((r) => r.emoji === emoji && r.viewerReacted);

        if (isMine) {
          const r = await removeChatMessageReactionAction(messageId, emoji);
          if (!r.ok) {
            setSendError(r.error);
            return;
          }
          applyServerReactionSummary(messageId, r.summary);
          return;
        }
        for (const e of mine) {
          const rm = await removeChatMessageReactionAction(messageId, e);
          if (rm.ok) applyServerReactionSummary(messageId, rm.summary);
        }
        const add = await addChatMessageReactionAction(messageId, emoji);
        if (!add.ok) {
          setSendError(add.error);
          return;
        }
        applyServerReactionSummary(messageId, add.summary);
      } finally {
        reactionBusyRef.current.delete(messageId);
      }
    },
    [conversation, applyServerReactionSummary],
  );

  const getReactions = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      return reactionOverrides[messageId] ?? msg?.reactions ?? [];
    },
    [messages, reactionOverrides],
  );

  const sendText = useCallback(async () => {
    if (!conversation) return;
    const body = draft.trim();
    if (!body || sending || uploading) return;
    if (conversation.chatType === "direct") {
      const rel = conversation.directPeerRelationshipStatus;
      if (rel === "blocked_by_me") {
        setSendError("Bạn đã chặn người này. Không thể gửi tin nhắn.");
        return;
      }
      if (rel === "blocked_me") {
        setSendError("Bạn không thể nhắn tin vì đã bị chặn.");
        return;
      }
    }

    flushTypingStop();
    setSendError(null);
    setSending(true);
    const replyToId =
      replyTarget && replyTarget.convId === conversation.id
        ? replyTarget.message.id
        : undefined;

    const r = await sendChatTextMessageAction({
      conversationId: conversation.id,
      content: body,
      clientMessageId: buildClientMessageId(),
      replyToMessageId: replyToId,
    });

    setSending(false);
    if (!r.ok) {
      setSendError(r.error);
      return;
    }

    scrollToEndAfterPaintRef.current = "smooth";
    setDraft("");
    setReplyTarget(null);
    setMessages((prev) => {
      if (prev.some((m) => m.id === r.message.id)) return prev;
      return applyReceipts([...prev, r.message]);
    });
    void markConversationReadAction(conversation.id, r.message.id);
    realtimeRef.current?.emitSeen(conversation.id, r.message.id);
    void refreshSidebar();
  }, [
    conversation,
    draft,
    replyTarget,
    sending,
    uploading,
    refreshSidebar,
    applyReceipts,
    flushTypingStop,
  ]);

  const sendSticker = useCallback(
    async (stickerId: string, _emoji: string) => {
      void _emoji;
      if (!conversation || sending || uploading) return;
      if (conversation.chatType === "direct") {
        const rel = conversation.directPeerRelationshipStatus;
        if (rel === "blocked_by_me") {
          setSendError("Bạn đã chặn người này. Không thể gửi tin nhắn.");
          return;
        }
        if (rel === "blocked_me") {
          setSendError("Bạn không thể nhắn tin vì đã bị chặn.");
          return;
        }
      }
      flushTypingStop();
      setSendError(null);
      setSending(true);
      const replyToId =
        replyTarget && replyTarget.convId === conversation.id
          ? replyTarget.message.id
          : undefined;

      const r = await sendChatStickerMessageAction({
        conversationId: conversation.id,
        stickerId,
        clientMessageId: buildClientMessageId(),
        replyToMessageId: replyToId,
      });

      setSending(false);
      if (!r.ok) {
        setSendError(r.error);
        return;
      }

      scrollToEndAfterPaintRef.current = "smooth";
      setReplyTarget(null);
      setMessages((prev) => {
        if (prev.some((m) => m.id === r.message.id)) return prev;
        return applyReceipts([...prev, r.message]);
      });
      void markConversationReadAction(conversation.id, r.message.id);
      realtimeRef.current?.emitSeen(conversation.id, r.message.id);
      void refreshSidebar();
    },
    [conversation, replyTarget, sending, uploading, refreshSidebar, applyReceipts, flushTypingStop],
  );

  const uploadAndSendAttachment = useCallback(
    async (file: File, mode: "image" | "file") => {
      if (!conversation) return;
      if (sending || uploading) return;
      if (conversation.chatType === "direct") {
        const rel = conversation.directPeerRelationshipStatus;
        if (rel === "blocked_by_me") {
          setSendError("Bạn đã chặn người này. Không thể gửi tin nhắn.");
          return;
        }
        if (rel === "blocked_me") {
          setSendError("Bạn không thể nhắn tin vì đã bị chặn.");
          return;
        }
      }

      setSendError(null);
      setUploading(true);
      setUploadingLabel(mode === "image" ? "Đang tải ảnh…" : "Đang tải tệp…");

      try {
        const normalizedMime =
          file.type && file.type.trim().length > 0
            ? file.type.trim().toLowerCase()
            : mode === "image"
              ? "image/jpeg"
              : "application/octet-stream";
        const uploadType: "image" | "file" | "voice" | "video" | "other" =
          mode === "image"
            ? "image"
            : normalizedMime.startsWith("video/")
              ? "video"
              : normalizedMime.startsWith("audio/")
                ? "voice"
                : "file";

        const init = await initChatUploadAction({
          fileName: file.name || (mode === "image" ? "image.jpg" : "file.bin"),
          mimeType: normalizedMime,
          fileSize: file.size,
          uploadType,
        });
        if (!init.ok) {
          setSendError(init.error);
          return;
        }

        const headers: Record<string, string> = { ...init.uploadHeaders };
        if (init.putBearerToken) {
          headers.Authorization = `Bearer ${init.putBearerToken}`;
        }

        const putRes = await fetch(init.uploadUrl, {
          method: init.uploadMethod,
          headers,
          body: file,
        });
        if (!putRes.ok) {
          setSendError(`Upload thất bại (${putRes.status}).`);
          return;
        }

        setUploadingLabel("Đang xử lý đính kèm…");
        const done = await completeChatUploadAction(init.uploadSessionId);
        if (!done.ok) {
          setSendError(done.error);
          return;
        }

        const replyToId =
          replyTarget && replyTarget.convId === conversation.id
            ? replyTarget.message.id
            : undefined;

        const sent = await sendChatMessageWithAttachmentsAction({
          conversationId: conversation.id,
          clientMessageId: buildClientMessageId(),
          type: uploadType,
          attachmentIds: [done.attachmentId],
          replyToMessageId: replyToId,
        });
        if (!sent.ok) {
          setSendError(sent.error);
          return;
        }

        scrollToEndAfterPaintRef.current = "smooth";
        setReplyTarget(null);
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.message.id)) return prev;
          return applyReceipts([...prev, sent.message]);
        });
        void markConversationReadAction(conversation.id, sent.message.id);
        realtimeRef.current?.emitSeen(conversation.id, sent.message.id);
        void refreshSidebar();
      } catch (e) {
        setSendError(e instanceof Error ? e.message : "Không gửi được đính kèm.");
      } finally {
        setUploading(false);
        setUploadingLabel(null);
      }
    },
    [conversation, sending, uploading, replyTarget, applyReceipts, refreshSidebar],
  );

  const handleImagePicked = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (!file.type.toLowerCase().startsWith("image/")) {
        setSendError("Vui lòng chọn tệp ảnh hợp lệ.");
        return;
      }
      void uploadAndSendAttachment(file, "image");
    },
    [uploadAndSendAttachment],
  );

  const handleFilePicked = useCallback(
    (file: File | null) => {
      if (!file) return;
      void uploadAndSendAttachment(file, "file");
    },
    [uploadAndSendAttachment],
  );

  const updateMessageInThread = useCallback(
    (nextMessage: Message) => {
      setMessages((prev) => {
        if (!prev.some((m) => m.id === nextMessage.id)) return prev;
        return applyReceipts(prev.map((m) => (m.id === nextMessage.id ? nextMessage : m)));
      });
    },
    [applyReceipts],
  );

  const openForwardForMessage = useCallback(
    async (message: Message) => {
      if (!conversation) return;
      if (message.kind === "system") return;
      setForwardError(null);
      setForwardSourceMessageId(message.id);
      setForwardOpen(true);
      setForwardLoading(true);
      const r = await fetchConversationsListAction();
      setForwardLoading(false);
      if (!r.ok) {
        setForwardError(r.error);
        setForwardOptions([]);
        return;
      }
      setForwardOptions(r.conversations.filter((c) => c.id !== conversation.id));
    },
    [conversation],
  );

  const runForwardMessage = useCallback(
    async (targetConversationId: string) => {
      if (!forwardSourceMessageId) return;
      setForwardError(null);
      setForwardBusyConversationId(targetConversationId);
      const r = await forwardChatMessageAction({
        messageId: forwardSourceMessageId,
        targetConversationId,
        clientMessageId: buildClientMessageId(),
      });
      setForwardBusyConversationId(null);
      if (!r.ok) {
        setForwardError(r.error);
        return;
      }
      setForwardOpen(false);
      setForwardSourceMessageId(null);
      setSendError("Đã chuyển tiếp tin nhắn.");
      void refreshSidebar();
    },
    [forwardSourceMessageId, refreshSidebar],
  );

  const runRecallOrDelete = useCallback(async () => {
    if (!confirmAction) return;
    setMessageActionBusy(true);
    const res =
      confirmAction.kind === "recall"
        ? await recallChatMessageAction(confirmAction.messageId)
        : await deleteChatMessageAction(confirmAction.messageId);
    setMessageActionBusy(false);
    if (!res.ok) {
      setSendError(res.error);
      return;
    }
    updateMessageInThread(res.message);
    setConfirmAction(null);
    void refreshSidebar();
  }, [confirmAction, refreshSidebar, updateMessageInThread]);

  const onMessageScroll = useCallback(() => {
    const el = messageScrollRef.current;
    if (!el) return;
    nearBottomRef.current = isScrollNearBottom(el);
  }, []);

  useLayoutEffect(() => {
    const el = messageScrollRef.current;
    if (!el || loading) return;

    const mode = scrollToEndAfterPaintRef.current;
    if (mode !== "none") {
      scrollToEndAfterPaintRef.current = "none";
      const behavior: ScrollBehavior = mode === "smooth" ? "smooth" : "auto";
      el.scrollTo({ top: el.scrollHeight, behavior });
      if (mode === "auto") {
        nearBottomRef.current = true;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const box = messageScrollRef.current;
          if (!box) return;
          box.scrollTo({ top: box.scrollHeight, behavior: "auto" });
        });
      });
      return;
    }

    if (nearBottomRef.current || isScrollNearBottom(el)) {
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!conversation) return;
    const root = messageScrollRef.current;
    if (!root) return;

    const pinIfFollowing = () => {
      if (loading) return;
      const el = messageScrollRef.current;
      if (!el) return;
      if (!nearBottomRef.current && !isScrollNearBottom(el)) return;
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
    };

    const ro = new ResizeObserver(() => {
      pinIfFollowing();
    });
    ro.observe(root);
    const inner = root.firstElementChild;
    if (inner) ro.observe(inner);
    return () => ro.disconnect();
  }, [conversation?.id, loading]);

  const replyRef: ReplyPreviewRef | null =
    conversation && replyTarget && replyTarget.convId === conversation.id
      ? {
          messageId: replyTarget.message.id,
          snippet: messageSnippet(replyTarget.message),
          isOwn: replyTarget.message.isOwn,
        }
      : null;

  const typingStatus = peerTyping ? "Đang soạn tin nhắn…" : null;

  const directMessagingGuard = useMemo(() => {
    const c = conversation;
    if (!c || c.chatType !== "direct") {
      return { canSend: true, bannerKind: null as null | "blocked_by_me" | "blocked_me" | "stranger" };
    }
    const rel = c.directPeerRelationshipStatus;
    if (rel === "blocked_by_me") return { canSend: false, bannerKind: "blocked_by_me" as const };
    if (rel === "blocked_me") return { canSend: false, bannerKind: "blocked_me" as const };
    if (!rel || rel === "friend") return { canSend: true, bannerKind: null };
    return { canSend: true, bannerKind: "stranger" as const };
  }, [conversation]);

  const directMessagingBanner =
    directMessagingGuard.bannerKind === "blocked_by_me" ? (
      <div
        className="border-t border-red-200 bg-red-50 px-3 py-2"
        role="status"
      >
        <p className="text-center text-[12px] font-medium text-red-800">
          Bạn đã chặn người này. Tin nhắn không được gửi đi.
        </p>
      </div>
    ) : directMessagingGuard.bannerKind === "blocked_me" ? (
      <div
        className="border-t border-red-200 bg-red-50 px-3 py-2"
        role="status"
      >
        <p className="text-center text-[12px] font-medium text-red-800">
          Bạn đã bị chặn. Không thể gửi tin nhắn trong cuộc trò chuyện này.
        </p>
      </div>
    ) : directMessagingGuard.bannerKind === "stranger" ? (
      <div
        className="border-t border-amber-200 bg-amber-50 px-3 py-2"
        role="status"
      >
        <p className="text-center text-[12px] text-amber-950">
          Cảnh báo: {conversation?.title ?? "Người này"} chưa là bạn bè hoặc chưa chấp nhận lời mời kết bạn. Bạn vẫn có
          thể nhắn tin — hãy cẩn trọng với nội dung từ người lạ.
        </p>
      </div>
    ) : null;

  return (
    <section
      className="flex min-w-0 flex-1 flex-col bg-[var(--zalo-chat-bg)]"
      aria-label="Khung trò chuyện"
    >
      <ChatHeader conversation={conversation} />
      <div
        ref={messageScrollRef}
        onScroll={onMessageScroll}
        className="min-h-0 flex-1 overflow-y-auto bg-[var(--zalo-chat-bg)]"
      >
        {conversation ? (
          <>
            {loadError ? (
              <div className="px-4 py-3" role="alert">
                <p className="text-center text-[13px] text-red-600/90">{loadError}</p>
              </div>
            ) : null}
            {loading ? (
              <div className="flex justify-center py-10">
                <p className="text-[13px] text-[var(--zalo-text-muted)]">Đang tải tin nhắn…</p>
              </div>
            ) : (
              <>
                {nextCursor ? (
                  <div className="flex justify-center py-2">
                    <button
                      type="button"
                      onClick={() => void loadOlder()}
                      disabled={loadOlderLoading}
                      className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[var(--zalo-blue)] shadow-sm ring-1 ring-black/[0.06] disabled:opacity-50"
                    >
                      {loadOlderLoading ? "Đang tải…" : "Tải tin nhắn cũ hơn"}
                    </button>
                  </div>
                ) : null}
                <MessageList
                  messages={messages}
                  getReactions={getReactions}
                  onToggleReaction={onToggleReaction}
                  onReply={(m) => {
                    if (conversation) setReplyTarget({ convId: conversation.id, message: m });
                  }}
                  onRecall={(m) => {
                    if (!m.isOwn || m.kind === "system") return;
                    setConfirmAction({
                      kind: "recall",
                      messageId: m.id,
                      title: "Thu hồi tin nhắn?",
                      description: "Tin nhắn sẽ bị thu hồi với tất cả thành viên trong cuộc trò chuyện.",
                      confirmLabel: "Thu hồi",
                      variant: "danger",
                    });
                  }}
                  onDelete={(m) => {
                    if (!m.isOwn || m.kind === "system") return;
                    setConfirmAction({
                      kind: "delete",
                      messageId: m.id,
                      title: "Xóa tin nhắn?",
                      description: "Tin nhắn sẽ chuyển sang trạng thái đã xóa.",
                      confirmLabel: "Xóa",
                      variant: "danger",
                    });
                  }}
                  onForward={(m) => void openForwardForMessage(m)}
                  onOpenImage={setPreviewUrl}
                  onOpenDocument={(embedUrl, title, downloadUrl) =>
                    setDocumentPreview({ embedUrl, title, downloadUrl })
                  }
                />
              </>
            )}
          </>
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center px-6">
            <p className="max-w-sm text-center text-[13px] text-[var(--zalo-text-muted)]">
              Chọn một cuộc trò chuyện từ danh sách để xem tin nhắn.
            </p>
          </div>
        )}
      </div>
      {conversation ? (
        <>
          {uploadingLabel ? (
            <div className="border-t border-[var(--zalo-border)] bg-[var(--zalo-surface)] px-3 py-1.5">
              <p className="text-center text-[12px] text-[var(--zalo-text-muted)]">{uploadingLabel}</p>
            </div>
          ) : null}
          {sendError ? (
            <div className="border-t border-red-200 bg-red-50 px-3 py-1.5" role="alert">
              <p className="text-center text-[12px] text-red-700">{sendError}</p>
            </div>
          ) : null}
          {directMessagingBanner}
          {peerTyping && conversation ? (
            <div
              className="shrink-0 border-t border-[var(--zalo-border)] bg-[var(--zalo-surface)]/80 px-2"
              role="status"
              aria-live="polite"
            >
              <TypingIndicator
                label={
                  conversation.chatType === "direct"
                    ? `${conversation.title} đang nhập…`
                    : "Đang soạn tin nhắn…"
                }
              />
            </div>
          ) : null}
          <MessageInput
            value={draft}
            onChange={(v) => {
              setDraft(v);
              notifyTypingActivity();
            }}
            onSend={() => void sendText()}
            disabled={loading || sending || uploading || !directMessagingGuard.canSend}
            replyTo={replyRef}
            onCancelReply={() => setReplyTarget(null)}
            attachmentsEnabled
            stickersEnabled
            onAttachment={(action) => {
              if (action === "image") {
                imagePickerRef.current?.click();
                return;
              }
              if (action === "file") {
                filePickerRef.current?.click();
              }
            }}
            onPickSticker={(stickerId, emoji) => void sendSticker(stickerId, emoji)}
            onInsertEmoji={(emoji) => {
              setDraft((d) => d + emoji);
              notifyTypingActivity();
            }}
            onComposerBlur={() => flushTypingStop()}
          />
          <input
            ref={imagePickerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              e.currentTarget.value = "";
              handleImagePicked(file);
            }}
          />
          <input
            ref={filePickerRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              e.currentTarget.value = "";
              handleFilePicked(file);
            }}
          />
        </>
      ) : (
        <MessageInput value="" onChange={() => {}} onSend={() => {}} disabled />
      )}
      <ForwardMessageDialog
        open={forwardOpen}
        options={forwardOptions}
        busyConversationId={forwardBusyConversationId}
        error={forwardError}
        onClose={() => {
          if (forwardBusyConversationId) return;
          setForwardOpen(false);
          setForwardError(null);
          setForwardSourceMessageId(null);
        }}
        onPickConversation={(id) => void runForwardMessage(id)}
      />
      {forwardOpen && forwardLoading ? (
        <div className="fixed inset-0 z-[121] flex items-center justify-center pointer-events-none">
          <div className="rounded-md bg-white px-3 py-2 text-[12px] text-[var(--zalo-text-muted)] shadow ring-1 ring-black/[0.08]">
            Đang tải danh sách hội thoại…
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description}
        confirmLabel={confirmAction?.confirmLabel ?? "Xác nhận"}
        variant={confirmAction?.variant ?? "default"}
        busy={messageActionBusy}
        onClose={() => {
          if (messageActionBusy) return;
          setConfirmAction(null);
        }}
        onConfirm={() => void runRecallOrDelete()}
      />
      <ImagePreviewModal imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
      <DocumentPreviewModal
        embedUrl={documentPreview?.embedUrl ?? null}
        title={documentPreview?.title ?? ""}
        downloadUrl={documentPreview?.downloadUrl ?? null}
        onClose={() => setDocumentPreview(null)}
      />
    </section>
  );
}
