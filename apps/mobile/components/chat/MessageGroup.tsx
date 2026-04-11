import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import { AppAvatar } from "@ui/AppAvatar";
import type { ChatRoomMessage, MessageSenderRole, OutgoingDeliveryState } from "@features/chat-room/types";
import { spacing } from "@theme";

import { MessageContent } from "./MessageContent";
import { ReactionBar } from "./ReactionBar";
import type { BubblePosition } from "./bubbleShape";

function bubblePosition(index: number, total: number): BubblePosition {
  if (total === 1) return "single";
  if (index === 0) return "first";
  if (index === total - 1) return "last";
  return "middle";
}

function deliveryCaption(state: OutgoingDeliveryState): string {
  switch (state) {
    case "sending":
      return "Đang gửi";
    case "sent":
      return "Đã gửi";
    case "delivered":
      return "Đã nhận";
    case "seen":
      return "Đã xem";
    default:
      return "";
  }
}

type MessageGroupProps = {
  messages: ChatRoomMessage[];
  role: MessageSenderRole;
  peerAvatarUrl?: string;
  peerName?: string;
  onMessagePress?: (message: ChatRoomMessage) => void;
  onMessageLongPress?: (message: ChatRoomMessage) => void;
  onImagePress?: (uri: string) => void;
  onReactionEmoji?: (messageId: string, emoji: string) => void;
};

function UnpackedMessageGroup({
  messages,
  role,
  peerAvatarUrl,
  peerName,
  onMessagePress,
  onMessageLongPress,
  onImagePress,
  onReactionEmoji,
}: MessageGroupProps) {
  const last = messages[messages.length - 1];
  const showDelivery = role === "me" && last.delivery !== undefined;

  const deliveryText = useMemo(() => {
    if (!last.delivery) return "";
    return deliveryCaption(last.delivery);
  }, [last.delivery]);

  const isOutgoing = role === "me";

  return (
    <View style={[styles.row, isOutgoing ? styles.rowOutgoing : styles.rowIncoming]}>
      {!isOutgoing ? (
        <View style={styles.avatarCol}>
          <AppAvatar uri={peerAvatarUrl} name={peerName ?? "?"} size="xs" />
        </View>
      ) : null}

      <View style={[styles.bubbleCol, isOutgoing && styles.bubbleColOut]}>
        {messages.map((m, index) => (
          <View
            key={m.id}
            style={[
              styles.msgBlock,
              index > 0 && styles.msgStacked,
              isOutgoing && styles.msgBlockOut,
            ]}
          >
            <MessageContent
              message={m}
              role={role}
              position={bubblePosition(index, messages.length)}
              onPress={() => onMessagePress?.(m)}
              onLongPress={() => onMessageLongPress?.(m)}
              onImagePress={(uri) => onImagePress?.(uri)}
            />
            <View style={[styles.reactionWrap, isOutgoing && styles.reactionWrapOut]}>
              <ReactionBar reactions={m.reactions} onPressEmoji={(emoji) => onReactionEmoji?.(m.id, emoji)} />
            </View>
          </View>
        ))}

        {showDelivery ? (
          <AppText variant="micro" color="textPlaceholder" style={[styles.delivery, isOutgoing && styles.deliveryOut]}>
            {deliveryText}
          </AppText>
        ) : null}
      </View>

      {isOutgoing ? <View style={styles.avatarColSpacer} /> : null}
    </View>
  );
}

export const MessageGroup = memo(UnpackedMessageGroup);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    width: "100%",
    marginBottom: spacing.sm,
    alignItems: "flex-end",
  },
  rowIncoming: {
    justifyContent: "flex-start",
  },
  rowOutgoing: {
    justifyContent: "flex-end",
  },
  /** Single peer avatar per group — stretch to bubble column height, pin avatar to bottom (last bubble) */
  avatarCol: {
    width: 30,
    marginRight: 6,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  avatarColSpacer: {
    width: 30,
  },
  bubbleCol: {
    flexShrink: 1,
    maxWidth: "100%",
  },
  bubbleColOut: {
    alignItems: "flex-end",
  },
  msgBlock: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  msgBlockOut: {
    alignSelf: "flex-end",
  },
  /** Same gap after text, image, file, sticker — reads as one run */
  msgStacked: {
    marginTop: 3,
  },
  reactionWrap: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  reactionWrapOut: {
    alignSelf: "flex-end",
  },
  delivery: {
    marginTop: 2,
    marginLeft: 1,
    fontWeight: "400",
    fontSize: 10,
    lineHeight: 13,
  },
  deliveryOut: {
    alignSelf: "flex-end",
    marginRight: 1,
    marginLeft: 0,
  },
});
