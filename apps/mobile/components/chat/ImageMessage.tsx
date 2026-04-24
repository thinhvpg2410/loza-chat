import { memo, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";

import type { MessageSenderRole, ReplyReference } from "@features/chat-room/types";
import { colors, radius, shadows } from "@theme";

import { bubbleShape, type BubblePosition } from "./bubbleShape";
import { ReplyInline } from "./ReplyPreview";

const MAX_W = 260;

type ImageMessageProps = {
  role: MessageSenderRole;
  position: BubblePosition;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  replyTo?: ReplyReference;
  onPress: () => void;
  onLongPress?: () => void;
  autoLoad?: boolean;
};

function UnpackedImageMessage({
  role,
  position,
  imageUrl,
  imageWidth,
  imageHeight,
  replyTo,
  onPress,
  onLongPress,
  autoLoad = true,
}: ImageMessageProps) {
  const { width: screenW } = useWindowDimensions();
  const [loaded, setLoaded] = useState(false);
  const [loadRequested, setLoadRequested] = useState(autoLoad);

  const { w, h } = useMemo(() => {
    const iw = imageWidth ?? 400;
    const ih = imageHeight ?? 300;
    const maxW = Math.min(MAX_W, screenW * 0.7);
    const aspect = ih / iw;
    const w = maxW;
    const h = Math.round(maxW * aspect);
    return { w, h: Math.min(h, 320) };
  }, [imageWidth, imageHeight, screenW]);

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
      accessibilityRole="imagebutton"
      accessibilityLabel="Ảnh"
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.wrap,
        bg,
        bubbleShape(role, position),
        shadow,
        role === "me" ? pressed && styles.pressed : pressed && styles.pressedIn,
      ]}
    >
      {replyTo ? (
        <View style={styles.replyPad}>
          <ReplyInline reply={replyTo} />
        </View>
      ) : null}
      <View style={[styles.frame, { width: w, height: h }]}>
        {!loadRequested ? (
          <Pressable style={[styles.placeholder, { width: w, height: h }]} onPress={() => setLoadRequested(true)}>
            <ActivityIndicator color={colors.primary} />
          </Pressable>
        ) : !loaded ? (
          <View style={[styles.placeholder, { width: w, height: h }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
        {loadRequested ? (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.img, { width: w, height: h }, !loaded && styles.imgHidden]}
            contentFit="cover"
            transition={200}
            onLoadEnd={() => setLoaded(true)}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

export const ImageMessage = memo(UnpackedImageMessage);

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
  },
  replyPad: {
    paddingHorizontal: 4,
    paddingTop: 3,
    paddingBottom: 2,
    maxWidth: 280,
  },
  frame: {
    borderRadius: radius.xs,
    overflow: "hidden",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  img: {
    borderRadius: radius.xs,
  },
  imgHidden: {
    opacity: 0,
    position: "absolute",
  },
  pressed: {
    opacity: 0.92,
  },
  pressedIn: {
    opacity: 0.96,
  },
});
