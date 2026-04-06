import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect } from "react";
import { Dimensions, Modal, Pressable, StatusBar, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@theme";

const { height: SCREEN_H } = Dimensions.get("window");

type ImageViewerModalProps = {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
};

export function ImageViewerModal({ visible, imageUri, onClose }: ImageViewerModalProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);

  const close = useCallback(() => {
    translateY.value = 0;
    onClose();
  }, [onClose, translateY]);

  useEffect(() => {
    if (visible) translateY.value = 0;
  }, [visible, translateY]);

  const pan = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (translateY.value > 72 || e.velocityY > 900) {
        translateY.value = withSpring(SCREEN_H, { damping: 28, stiffness: 260 }, (finished) => {
          if (finished) runOnJS(close)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 28, stiffness: 320 });
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!imageUri) return null;

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={close}>
      <StatusBar barStyle="light-content" />
      <View style={styles.root}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.content, animStyle]}>
            <Image source={{ uri: imageUri }} style={styles.image} contentFit="contain" transition={0} />
          </Animated.View>
        </GestureDetector>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          onPress={close}
          style={[styles.closeBtn, { top: insets.top + 8 }]}
        >
          <Ionicons name="close" size={28} color={colors.textInverse} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    zIndex: 10,
    padding: 8,
  },
});
