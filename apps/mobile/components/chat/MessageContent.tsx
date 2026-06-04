import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { ChatRoomMessage, MessageSenderRole } from "@features/chat-room/types";
import { AppText } from "@ui/AppText";
import { colors } from "@theme";

import { FileMessage } from "./FileMessage";
import { ImageMessage } from "./ImageMessage";
import { MessageBubble, type BubblePosition } from "./MessageBubble";
import { StickerMessage } from "./StickerMessage";

// ── Call message ─────────────────────────────────────────────────────────────

function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type CallBubbleProps = {
  role: MessageSenderRole;
  callType: "voice" | "video";
  callStatus: "answered" | "missed" | "cancelled" | "busy";
  callDurationSeconds: number;
  onPress?: () => void;
  onLongPress?: () => void;
};

function CallBubble({ role, callType, callStatus, callDurationSeconds, onPress, onLongPress }: CallBubbleProps) {
  const isOwn = role === "me";
  const isMissed = callStatus === "missed" || callStatus === "busy";

  const label = (() => {
    const typeLabel = callType === "video" ? "Gọi video" : "Gọi thoại";
    switch (callStatus) {
      case "answered":   return `${typeLabel} · ${formatCallDuration(callDurationSeconds)}`;
      case "missed":     return `${typeLabel} nhỡ`;
      case "cancelled":  return `${typeLabel} đã huỷ`;
      case "busy":       return `${typeLabel} · Đang bận`;
    }
  })();

  const iconName = callType === "video" ? "videocam" : "call";

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.callBubble,
        isOwn ? styles.callBubbleOwn : styles.callBubblePeer,
        pressed && styles.callBubblePressed,
      ]}
    >
      <Ionicons
        name={iconName}
        size={18}
        color={isMissed ? colors.danger : isOwn ? colors.textInverse : colors.primary}
      />
      <View style={styles.callText}>
        <AppText
          variant="subhead"
          style={[
            styles.callLabel,
            isOwn ? styles.callLabelOwn : undefined,
            isMissed && !isOwn ? styles.callLabelMissed : undefined,
          ]}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  callBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 160,
    maxWidth: 260,
  },
  callBubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  callBubblePeer: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  callBubblePressed: {
    opacity: 0.8,
  },
  callText: {
    flex: 1,
  },
  callLabel: {
    fontWeight: "500",
    color: colors.text,
  },
  callLabelOwn: {
    color: colors.textInverse,
  },
  callLabelMissed: {
    color: colors.danger,
  },
});

export type MessageContentProps = {
  message: ChatRoomMessage;
  role: MessageSenderRole;
  position: BubblePosition;
  onPress: () => void;
  onLongPress: () => void;
  onImagePress: (uri: string) => void;
  onSwipeReply?: () => void;
  autoLoadMedia?: boolean;
};

function UnpackedMessageContent({
  message,
  role,
  position,
  onPress,
  onLongPress,
  onImagePress,
  onSwipeReply,
  autoLoadMedia = true,
}: MessageContentProps) {
  switch (message.kind) {
    case "text":
      return (
        <MessageBubble
          role={role}
          position={position}
          text={message.body ?? ""}
          replyTo={message.replyTo}
          onPress={onPress}
          onLongPress={onLongPress}
          onSwipeReply={onSwipeReply}
        />
      );
    case "image":
      return (
        <ImageMessage
          role={role}
          position={position}
          imageUrl={message.imageUrl ?? ""}
          imageWidth={message.imageWidth}
          imageHeight={message.imageHeight}
          replyTo={message.replyTo}
          onPress={() => message.imageUrl && onImagePress(message.imageUrl)}
          onLongPress={onLongPress}
          autoLoad={autoLoadMedia}
        />
      );
    case "file":
      return message.file ? (
        <FileMessage
          role={role}
          position={position}
          name={message.file.name}
          sizeBytes={message.file.sizeBytes}
          mime={message.file.mime}
          fileUrl={message.file.url}
          replyTo={message.replyTo}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      ) : null;
    case "sticker":
      return (
        <StickerMessage
          role={role}
          stickerUrl={message.stickerUrl}
          stickerEmoji={message.stickerEmoji}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      );
    case "call":
      return (
        <CallBubble
          role={role}
          callType={message.callType ?? "voice"}
          callStatus={message.callStatus ?? "cancelled"}
          callDurationSeconds={message.callDurationSeconds ?? 0}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      );
    case "groupEvent":
      return null;
    default:
      return null;
  }
}

export const MessageContent = memo(UnpackedMessageContent);
