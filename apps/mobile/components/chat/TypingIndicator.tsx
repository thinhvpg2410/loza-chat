import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, spacing } from "@theme";

type TypingIndicatorProps = {
  visible: boolean;
  /** Optional label — default “Đang nhập” */
  label?: string;
};

export function TypingIndicator({ visible, label = "Đang nhập" }: TypingIndicatorProps) {
  const dot0 = useRef(new Animated.Value(0.35)).current;
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const dots = [dot0, dot1, dot2];
    if (!visible) {
      dots.forEach((d) => d.setValue(0.35));
      return;
    }

    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(d, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(d, {
            toValue: 0.35,
            duration: 300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(520),
        ]),
      ),
    );

    const master = Animated.parallel(loops);
    master.start();
    return () => {
      master.stop();
    };
  }, [visible, dot0, dot1, dot2]);

  if (!visible) return null;

  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel={`${label}…`}>
      <AppText variant="micro" color="textMuted" style={styles.caption}>
        {label}
      </AppText>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { opacity: dot0 }]} />
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xs,
    gap: 6,
  },
  caption: {
    fontWeight: "500",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.textMuted,
  },
});
