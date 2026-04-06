import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import { AppText } from "@ui/AppText";
import type { MessageSenderRole } from "@features/chat-room/types";

/** Slightly oversized vs text — Zalo-like, no bubble chrome */
const STICKER_SIZE = 116;

type StickerMessageProps = {
  role: MessageSenderRole;
  stickerUrl?: string;
  stickerEmoji?: string;
  onPress?: () => void;
  onLongPress?: () => void;
};

function UnpackedStickerMessage({ role, stickerUrl, stickerEmoji, onPress, onLongPress }: StickerMessageProps) {
  const align = role === "me" ? "flex-end" : "flex-start";

  return (
    <View style={[styles.wrap, { alignItems: align }]}>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel="Sticker"
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
      >
        {stickerUrl ? (
          <Image source={{ uri: stickerUrl }} style={styles.img} contentFit="contain" transition={120} />
        ) : (
          <AppText style={styles.emoji}>{stickerEmoji ?? "🙂"}</AppText>
        )}
      </Pressable>
    </View>
  );
}

export const StickerMessage = memo(UnpackedStickerMessage);

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  hit: {
    minWidth: STICKER_SIZE,
    minHeight: STICKER_SIZE,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  img: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
  },
  emoji: {
    fontSize: 98,
    lineHeight: STICKER_SIZE,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.9,
  },
});
