import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";

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
  mime?: string;
  fileUrl?: string;
  replyTo?: ReplyReference;
  onPress: () => void;
  onLongPress?: () => void;
};

function UnpackedFileMessage({
  role,
  position,
  name,
  sizeBytes,
  mime,
  fileUrl,
  replyTo,
  onPress,
  onLongPress,
}: FileMessageProps) {
  const bg =
    role === "me"
      ? { backgroundColor: colors.chatBubbleOutgoing }
      : {
          backgroundColor: colors.chatBubbleIncoming,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chatBubbleIncomingBorder,
        };
  const shadow = role === "peer" ? shadows.hairline : shadows.none;
  const isVoice = useMemo(() => Boolean(mime?.toLowerCase().startsWith("audio/") && fileUrl), [fileUrl, mime]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopVoice = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } finally {
      soundRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      void stopVoice();
    };
  }, [stopVoice]);

  const toggleVoice = useCallback(async () => {
    if (!fileUrl || !isVoice) return;
    if (soundRef.current) {
      await stopVoice();
      return;
    }
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUrl },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            void stopVoice();
          }
        },
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [fileUrl, isVoice, stopVoice]);

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
      {isVoice ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Dừng ghi âm" : "Phát ghi âm"}
          onPress={() => {
            void toggleVoice();
          }}
          style={({ pressed }) => [styles.voiceRow, pressed && styles.pressedIn]}
        >
          <View style={[styles.iconBox, role === "me" ? styles.iconBoxOut : styles.iconBoxIn]}>
            <Ionicons name={isPlaying ? "pause-outline" : "play-outline"} size={20} color={colors.primary} />
          </View>
          <View style={styles.meta}>
            <AppText variant="subhead" numberOfLines={1} style={styles.fileName}>
              Ghi âm
            </AppText>
            <AppText variant="micro" color="textMuted">
              {isPlaying ? "Đang phát..." : "Nhấn để nghe ngay"}
            </AppText>
          </View>
        </Pressable>
      ) : null}
      {!isVoice ? (
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
      ) : null}
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
  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
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
