import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import { AppAvatar } from "@ui/AppAvatar";
import type { ChatRoomMessage, MessageSenderRole, OutgoingDeliveryState } from "@features/chat-room/types";
import { spacing } from "@theme";

import { MessageBubble, type BubblePosition } from "./MessageBubble";

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
};

function UnpackedMessageGroup({ messages, role, peerAvatarUrl, peerName }: MessageGroupProps) {
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
          <View style={styles.avatarSlot}>
            <AppAvatar uri={peerAvatarUrl} name={peerName ?? "?"} size="xs" />
          </View>
        </View>
      ) : null}

      <View style={[styles.bubbleCol, isOutgoing && styles.bubbleColOut]}>
        {messages.map((m, index) => (
          <View
            key={m.id}
            style={[
              styles.bubbleWrap,
              index > 0 && styles.bubbleStacked,
              isOutgoing && styles.bubbleWrapOut,
            ]}
          >
            <MessageBubble role={role} position={bubblePosition(index, messages.length)} text={m.body} />
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
  },
  rowIncoming: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  rowOutgoing: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  avatarCol: {
    width: 30,
    marginRight: 6,
    alignItems: "flex-start",
  },
  avatarSlot: {
    width: 30,
    justifyContent: "flex-start",
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
  bubbleWrap: {
    alignSelf: "flex-start",
  },
  bubbleWrapOut: {
    alignSelf: "flex-end",
  },
  bubbleStacked: {
    marginTop: 0,
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
