import { forwardRef, useCallback, useEffect, useMemo } from "react";
import { FlatList, Platform, StyleSheet, View, type ListRenderItem } from "react-native";

import { buildMessageFeed } from "@features/chat-room";
import type { ChatRoomMessage, MessageFeedItem } from "@features/chat-room/types";
import { spacing } from "@theme";

import { MessageGroup } from "./MessageGroup";
import { TimestampSeparator } from "./TimestampSeparator";

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

  useEffect(() => {
    requestAnimationFrame(() => {
      if (typeof ref === "object" && ref?.current) {
        ref.current.scrollToEnd({ animated: true });
      }
    });
  }, [messages.length, ref]);

  return (
    <FlatList
      ref={ref}
      data={feed}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.list}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      showsVerticalScrollIndicator={false}
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
