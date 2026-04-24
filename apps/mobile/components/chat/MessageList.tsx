import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { buildMessageFeed } from "@features/chat-room";
import type { ChatRoomMessage, MessageFeedItem } from "@features/chat-room/types";
import { colors, spacing } from "@theme";

import { ChatGroupEventRow } from "./ChatGroupEventRow";
import { MessageGroup } from "./MessageGroup";
import { TimestampSeparator } from "./TimestampSeparator";

const NEAR_END_THRESHOLD_PX = 88;

type MessageListProps = {
  messages: ChatRoomMessage[];
  /** Conversation id (or any stable key): when it changes, scroll resets to newest messages. */
  threadKey?: string;
  peerAvatarUrl?: string;
  peerName?: string;
  /** Kéo lên đầu danh sách để tải tin cũ hơn (pagination). */
  onNearTopLoadOlder?: () => void;
  /** Còn trang cũ để tải (cursor từ API). */
  hasOlderMessages?: boolean;
  loadingOlder?: boolean;
  onMessagePress?: (message: ChatRoomMessage) => void;
  onMessageLongPress?: (message: ChatRoomMessage) => void;
  onImagePress?: (uri: string) => void;
  onReactionEmoji?: (messageId: string, emoji: string) => void;
  onSwipeReply?: (message: ChatRoomMessage) => void;
  autoLoadMedia?: boolean;
};

export type MessageListHandle = {
  scrollToMessage: (messageId: string) => void;
};

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(function MessageList(
  {
    messages,
    threadKey,
    peerAvatarUrl,
    peerName,
    onNearTopLoadOlder,
    hasOlderMessages,
    loadingOlder,
    onMessagePress,
    onMessageLongPress,
    onImagePress,
    onReactionEmoji,
    onSwipeReply,
    autoLoadMedia = true,
  },
  ref,
) {
  const listRef = useRef<FlatList<MessageFeedItem>>(null);
  useImperativeHandle(
    ref,
    () => ({
      scrollToMessage: (messageId: string) => {
        const index = feed.findIndex(
          (item) =>
            item.kind === "group" &&
            item.messages.some((msg) => msg.id === messageId),
        );
        if (index < 0) return;
        listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.4 });
      },
    }),
    [feed],
  );

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  /** True until user scrolls away from the latest messages. */
  const nearBottomRef = useRef(true);
  const prevLengthRef = useRef(0);
  const contentHeightRef = useRef(0);
  const loadOlderCooldownRef = useRef<number>(0);

  const feed = useMemo(() => buildMessageFeed(messages), [messages]);
  const reactionSignature = useMemo(
    () =>
      messages
        .map((m) => {
          if (m.kind === "groupEvent") {
            return `${m.id}:ge:${m.groupEventBadge ?? ""}:${m.groupEventDetail ?? ""}`;
          }
          const rx = m.reactions?.map((r) => `${r.emoji}:${r.count}:${r.reactedByMe ? 1 : 0}`).join("|") ?? "";
          return `${m.id}:${rx}`;
        })
        .join(";"),
    [messages],
  );

  const renderItem: ListRenderItem<MessageFeedItem> = useCallback(
    ({ item }) => {
      if (item.kind === "separator") {
        return <TimestampSeparator label={item.label} />;
      }
      if (item.kind === "groupEvent") {
        const m = item.message;
        return <ChatGroupEventRow badge={m.groupEventBadge ?? ""} detail={m.groupEventDetail} />;
      }
      return (
        <MessageGroup
          messages={item.messages}
          role={item.role}
          peerAvatarUrl={peerAvatarUrl}
          peerName={peerName}
          onMessagePress={onMessagePress}
          onMessageLongPress={onMessageLongPress}
          onImagePress={onImagePress}
          onReactionEmoji={onReactionEmoji}
          onSwipeReply={onSwipeReply}
          autoLoadMedia={autoLoadMedia}
        />
      );
    },
    [peerAvatarUrl, peerName, onMessagePress, onMessageLongPress, onImagePress, onReactionEmoji, onSwipeReply, autoLoadMedia],
  );

  const keyExtractor = useCallback((item: MessageFeedItem) => item.key, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const distanceFromEnd = contentSize.height - layoutMeasurement.height - contentOffset.y;
      nearBottomRef.current = distanceFromEnd < NEAR_END_THRESHOLD_PX;

      if (
        onNearTopLoadOlder &&
        hasOlderMessages &&
        !loadingOlder &&
        contentOffset.y <= 72 &&
        Date.now() - loadOlderCooldownRef.current > 700
      ) {
        loadOlderCooldownRef.current = Date.now();
        onNearTopLoadOlder();
      }
    },
    [hasOlderMessages, loadingOlder, onNearTopLoadOlder],
  );

  const onContentSizeChange = useCallback((_w: number, h: number) => {
    if (!nearBottomRef.current) {
      contentHeightRef.current = h;
      return;
    }
    const prev = contentHeightRef.current;
    contentHeightRef.current = h;
    if (h > prev + 1) {
      listRef.current?.scrollToEnd({ animated: false });
    }
  }, []);

  useEffect(() => {
    prevLengthRef.current = 0;
    nearBottomRef.current = true;
    contentHeightRef.current = 0;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: false });
      });
    });
  }, [threadKey]);

  useEffect(() => {
    const len = messages.length;
    const prev = prevLengthRef.current;
    if (len > prev) {
      const last = messagesRef.current[len - 1];
      const shouldFollow = nearBottomRef.current || last?.senderRole === "me";
      if (shouldFollow) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated: true });
          });
        });
      }
    }
    prevLengthRef.current = len;
  }, [messages.length]);

  return (
    <FlatList
      ref={listRef}
      data={feed}
      extraData={reactionSignature}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.list}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onContentSizeChange={onContentSizeChange}
      ListHeaderComponent={
        loadingOlder ? (
          <View style={styles.headerLoading}>
            <ActivityIndicator size="small" color={colors.textMuted} />
          </View>
        ) : null
      }
      ListFooterComponent={<View style={styles.footerPad} />}
      onScrollToIndexFailed={() => {
        listRef.current?.scrollToEnd({ animated: true });
      }}
    />
  );
});

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    flexGrow: 1,
  },
  footerPad: {
    height: 2,
  },
  headerLoading: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
});
