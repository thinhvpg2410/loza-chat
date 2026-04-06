import type { ViewStyle } from "react-native";

import type { MessageSenderRole } from "@features/chat-room/types";
import { radius } from "@theme";

export type BubblePosition = "single" | "first" | "middle" | "last";

/** Shared corner math for text/media bubbles */
export function bubbleShape(role: MessageSenderRole, position: BubblePosition): ViewStyle {
  const tail = 3;
  const r = radius.sm;

  if (role === "me") {
    if (position === "single" || position === "last" || position === "first") {
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
