import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { AppAvatar } from "@ui/AppAvatar";
import { AppText } from "@ui/AppText";
import { colors } from "@theme";
import { useCall } from "@/features/call/call-context";

export function IncomingCallModal() {
  const { callState, answerCall } = useCall();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const visible = callState.phase === "incoming";

  useEffect(() => {
    if (!visible) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [visible, pulseAnim]);

  if (callState.phase !== "incoming") return null;

  const { callerName, callerAvatarUrl, callType } = callState;
  const isVideo = callType === "video";

  return (
    <Modal
      transparent
      animationType="fade"
      statusBarTranslucent
      visible={visible}
      onRequestClose={() => void answerCall(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <AppText variant="caption" color="textMuted" style={styles.callTypeLabel}>
            {isVideo ? "Cuộc gọi video đến" : "Cuộc gọi thoại đến"}
          </AppText>

          <Animated.View style={{ transform: [{ scale: pulseAnim }], marginVertical: 16 }}>
            <AppAvatar uri={callerAvatarUrl ?? undefined} name={callerName} size="xl" />
          </Animated.View>

          <AppText variant="display" style={styles.callerName}>
            {callerName}
          </AppText>

          <View style={styles.actions}>
            {/* Decline */}
            <View style={styles.actionCol}>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.declineBtn, pressed && styles.pressed]}
                onPress={() => void answerCall(false)}
                accessibilityLabel="Từ chối"
              >
                <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
              </Pressable>
              <AppText variant="caption" color="textSecondary" style={styles.actionLabel}>
                Từ chối
              </AppText>
            </View>

            {/* Accept */}
            <View style={styles.actionCol}>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.acceptBtn, pressed && styles.pressed]}
                onPress={() => void answerCall(true)}
                accessibilityLabel="Trả lời"
              >
                <Ionicons name={isVideo ? "videocam" : "call"} size={28} color="#fff" />
              </Pressable>
              <AppText variant="caption" color="textSecondary" style={styles.actionLabel}>
                Trả lời
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  callTypeLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  callerName: {
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
  },
  actions: {
    flexDirection: "row",
    gap: 48,
    justifyContent: "center",
  },
  actionCol: {
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: {
    backgroundColor: colors.danger,
  },
  acceptBtn: {
    backgroundColor: colors.success,
  },
  pressed: {
    opacity: 0.8,
  },
  actionLabel: {
    fontWeight: "500",
  },
});
