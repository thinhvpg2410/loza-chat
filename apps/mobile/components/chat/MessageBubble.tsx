import { memo, useMemo } from "react";
import { Pressable, StyleSheet, useWindowDimensions, type ViewStyle } from "react-native";

import { AppText } from "@ui/AppText";
import type { MessageSenderRole } from "@features/chat-room/types";
import { colors, radius, shadows } from "@theme";

export type BubblePosition = "single" | "first" | "middle" | "last";

type MessageBubbleProps = {
  role: MessageSenderRole;
  position: BubblePosition;
  text: string;
};

function bubbleShape(role: MessageSenderRole, position: BubblePosition): ViewStyle {
  /** Zalo-like: modest corner radius, small tail on outer edge */
  const tail = 3;
  const r = radius.sm;

  if (role === "me") {
    if (position === "single" || position === "last") {
      return {
        borderTopLeftRadius: r,
        borderTopRightRadius: r,
        borderBottomLeftRadius: r,
        borderBottomRightRadius: tail,
      };
    }
    if (position === "first") {
      return {
        borderTopLeftRadius: r,
        borderTopRightRadius: r,
        borderBottomLeftRadius: r,
        borderBottomRightRadius: tail,
      };
    }
    return {
      borderTopLeftRadius: r,
      borderTopRightRadius: tail,
      borderBottomLeftRadius: r,
      borderBottomRightRadius: tail,
    };
  }

  if (position === "single" || position === "last") {
    return {
      borderTopLeftRadius: r,
      borderTopRightRadius: r,
      borderBottomLeftRadius: tail,
      borderBottomRightRadius: r,
    };
  }
  if (position === "first") {
    return {
      borderTopLeftRadius: r,
      borderTopRightRadius: r,
      borderBottomLeftRadius: tail,
      borderBottomRightRadius: r,
    };
  }
  return {
    borderTopLeftRadius: tail,
    borderTopRightRadius: r,
    borderBottomLeftRadius: tail,
    borderBottomRightRadius: r,
  };
}

function UnpackedMessageBubble({ role, position, text }: MessageBubbleProps) {
  const { width } = useWindowDimensions();
  /** Zalo-like: ~71% width, capped — slightly narrower than full-bleed “demo” bubbles */
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

  return (
    <Pressable
      accessibilityRole="text"
      style={({ pressed }) => [
        styles.press,
        { maxWidth: maxW },
        bg,
        bubbleShape(role, position),
        shadow,
        pressed ? (role === "me" ? styles.pressed : styles.pressedIncoming) : null,
      ]}
    >
      <AppText variant="body" style={styles.body} numberOfLines={32}>
        {text}
      </AppText>
    </Pressable>
  );
}

export const MessageBubble = memo(UnpackedMessageBubble);

const styles = StyleSheet.create({
  press: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "400",
    color: colors.text,
  },
  pressed: {
    opacity: 0.92,
  },
  pressedIncoming: {
    opacity: 0.96,
  },
});
