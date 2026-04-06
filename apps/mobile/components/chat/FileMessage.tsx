import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "@ui/AppText";
import { formatFileSize } from "@features/chat-room";
import type { MessageSenderRole, ReplyReference } from "@features/chat-room/types";
import { colors, radius, shadows } from "@theme";

import { bubbleShape, type BubblePosition } from "./bubbleShape";
import { ReplyInline } from "./ReplyPreview";

type FileMessageProps = {
  role: MessageSenderRole;
  position: BubblePosition;
  name: string;
  sizeBytes: number;
  replyTo?: ReplyReference;
  onPress: () => void;
  onLongPress?: () => void;
};

function UnpackedFileMessage({ role, position, name, sizeBytes, replyTo, onPress, onLongPress }: FileMessageProps) {
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
      accessibilityRole="button"
      accessibilityLabel={`Tệp ${name}`}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.card,
        bg,
        bubbleShape(role, position),
        shadow,
        role === "me" ? pressed && styles.pressed : pressed && styles.pressedIn,
      ]}
    >
      {replyTo ? (
        <View style={styles.replyBlock}>
          <ReplyInline reply={replyTo} />
        </View>
      ) : null}
      <View style={styles.cardRow}>
        <View style={[styles.iconBox, role === "me" ? styles.iconBoxOut : styles.iconBoxIn]}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.meta}>
          <AppText variant="subhead" numberOfLines={2} style={styles.fileName}>
            {name}
          </AppText>
          <AppText variant="micro" color="textMuted">
            {formatFileSize(sizeBytes)}
          </AppText>
        </View>
        <Ionicons name="download-outline" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

export const FileMessage = memo(UnpackedFileMessage);

const styles = StyleSheet.create({
  card: {
    maxWidth: 280,
    paddingVertical: 5,
    paddingHorizontal: 8,
    gap: 4,
  },
  replyBlock: {
    marginBottom: 3,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxOut: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  iconBoxIn: {
    backgroundColor: colors.surfaceSecondary,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontWeight: "600",
    color: colors.text,
  },
  pressed: {
    opacity: 0.92,
  },
  pressedIn: {
    opacity: 0.96,
  },
});
