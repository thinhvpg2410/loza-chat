import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import {
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
import { spacing } from "@theme";

import { MessageGroup } from "./MessageGroup";
import { TimestampSeparator } from "./TimestampSeparator";

const NEAR_END_THRESHOLD_PX = 88;

type MessageListProps = {
  messages: ChatRoomMessage[];
  peerAvatarUrl?: string;
  peerName?: string;
  onMessagePress?: (message: ChatRoomMessage) => void;
  onMessageLongPress?: (message: ChatRoomMessage) => void;
  onImagePress?: (uri: string) => void;
  onReactionEmoji?: (messageId: string, emoji: string) => void;
};

export const MessageList = forwardRef<FlatList<MessageFeedItem>, MessageListProps>(function MessageList(
  { messages, peerAvatarUrl, peerName, onMessagePress, onMessageLongPress, onImagePress, onReactionEmoji },
  ref,
) {
  const listRef = useRef<FlatList<MessageFeedItem>>(null);
  useImperativeHandle(ref, () => listRef.current!, []);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  /** True until user scrolls away from the latest messages. */
  const nearBottomRef = useRef(true);
  const prevLengthRef = useRef(0);
  const contentHeightRef = useRef(0);

  const feed = useMemo(() => buildMessageFeed(messages), [messages]);

  const renderItem: ListRenderItem<MessageFeedItem> = useCallback(
    ({ item }) => {
      if (item.kind === "separator") {
        return <TimestampSeparator label={item.label} />;
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
        />
      );
    },
    [peerAvatarUrl, peerName, onMessagePress, onMessageLongPress, onImagePress, onReactionEmoji],
  );

  const keyExtractor = useCallback((item: MessageFeedItem) => item.key, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const distanceFromEnd = contentSize.height - layoutMeasurement.height - contentOffset.y;
    nearBottomRef.current = distanceFromEnd < NEAR_END_THRESHOLD_PX;
  }, []);

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
      ListFooterComponent={<View style={styles.footerPad} />}
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
});
