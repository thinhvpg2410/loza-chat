import { memo, useMemo, useRef } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, useWindowDimensions } from "react-native";

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
  onSwipeReply?: () => void;
};

function UnpackedMessageBubble({
  role,
  position,
  text,
  replyTo,
  onPress,
  onLongPress,
  onSwipeReply,
}: MessageBubbleProps) {
  const { width } = useWindowDimensions();
  const maxW = useMemo(() => Math.min(width * 0.71, 268), [width]);
  const translateX = useRef(new Animated.Value(0)).current;

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
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Boolean(onSwipeReply) && role !== "me" && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 12,
        onPanResponderMove: (_evt, gesture) => {
          if (gesture.dx <= 0) return;
          translateX.setValue(Math.min(48, gesture.dx));
        },
        onPanResponderRelease: (_evt, gesture) => {
          const shouldReply = gesture.dx > 42;
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
          if (shouldReply) {
            onSwipeReply?.();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [onSwipeReply, role, translateX],
  );

  return (
    <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
      <Pressable
        accessibilityRole="text"
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
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
    </Animated.View>
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
