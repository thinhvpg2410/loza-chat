import { memo, useMemo } from "react";
import { Pressable, StyleSheet, useWindowDimensions } from "react-native";

import { AppText } from "@ui/AppText";
import { splitMentionTextParts } from "@features/chat-room/mentionText";
import type { MessageSenderRole, ReplyReference } from "@features/chat-room/types";
import { colors, shadows } from "@theme";

import { bubbleShape, type BubblePosition } from "./bubbleShape";
import { ReplyInline } from "./ReplyPreview";

export type { BubblePosition } from "./bubbleShape";

type MessageBubbleProps = {
  role: MessageSenderRole;
  position: BubblePosition;
  text: string;
  replyTo?: ReplyReference;
  onPress?: () => void;
  onLongPress?: () => void;
};

function UnpackedMessageBubble({ role, position, text, replyTo, onPress, onLongPress }: MessageBubbleProps) {
  const { width } = useWindowDimensions();
  const maxW = useMemo(() => Math.min(width * 0.71, 268), [width]);

  const bg =
    role === "me"
      ? { backgroundColor: colors.chatBubbleOutgoing }
      : {
          backgroundColor: colors.chatBubbleIncoming,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chatBubbleIncomingBorder,
        };

  const shadow = role === "peer" ? shadows.hairline : shadows.none;
  const mentionParts = useMemo(() => splitMentionTextParts(text), [text]);

  return (
    <Pressable
      accessibilityRole="text"
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.press,
        { maxWidth: maxW },
        bg,
        bubbleShape(role, position),
        shadow,
        pressed ? (role === "me" ? styles.pressed : styles.pressedIncoming) : null,
      ]}
    >
      {replyTo ? <ReplyInline reply={replyTo} /> : null}
      <AppText variant="body" style={styles.body} numberOfLines={32}>
        {mentionParts.map((part, idx) => (
          <AppText
            key={`mention-part-${idx}`}
            variant="body"
            style={part.isMention ? styles.mention : undefined}
          >
            {part.text}
          </AppText>
        ))}
      </AppText>
    </Pressable>
  );
}

export const MessageBubble = memo(UnpackedMessageBubble);

const styles = StyleSheet.create({
  press: {
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  body: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "400",
    color: colors.text,
  },
  mention: {
    color: colors.primary,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.92,
  },
  pressedIncoming: {
    opacity: 0.96,
  },
});
