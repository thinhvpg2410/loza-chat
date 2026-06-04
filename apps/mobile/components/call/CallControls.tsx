import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors } from "@theme";

type ControlButtonProps = {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
};

function ControlButton({ icon, label, onPress, active, danger }: ControlButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        active && styles.btnActive,
        danger && styles.btnDanger,
        pressed && styles.pressed,
      ]}
      accessibilityLabel={label}
    >
      <Ionicons name={icon as never} size={24} color={danger ? "#fff" : active ? colors.primary : colors.text} />
      <AppText variant="micro" style={[styles.label, danger && styles.labelDanger, active && styles.labelActive]}>
        {label}
      </AppText>
    </Pressable>
  );
}

type CallControlsProps = {
  callType: "voice" | "video";
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaker: boolean;
  isGroup: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleSpeaker: () => void;
  onEnd: () => void;
  onLeave: () => void;
};

export function CallControls({
  callType,
  isMuted,
  isCameraOff,
  isSpeaker,
  isGroup,
  onToggleMute,
  onToggleCamera,
  onToggleSpeaker,
  onEnd,
  onLeave,
}: CallControlsProps) {
  return (
    <View style={styles.row}>
      <ControlButton
        icon={isMuted ? "mic-off" : "mic"}
        label={isMuted ? "Bật micro" : "Tắt micro"}
        onPress={onToggleMute}
        active={isMuted}
      />
      {callType === "video" ? (
        <ControlButton
          icon={isCameraOff ? "videocam-off" : "videocam"}
          label={isCameraOff ? "Bật camera" : "Tắt camera"}
          onPress={onToggleCamera}
          active={isCameraOff}
        />
      ) : null}
      <ControlButton
        icon={isSpeaker ? "volume-high" : "volume-low"}
        label={isSpeaker ? "Tai nghe" : "Loa ngoài"}
        onPress={onToggleSpeaker}
        active={isSpeaker}
      />
      {isGroup ? (
        <ControlButton
          icon="exit-outline"
          label="Rời"
          onPress={onLeave}
          danger
        />
      ) : (
        <ControlButton
          icon="call"
          label="Kết thúc"
          onPress={onEnd}
          danger
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  btn: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 60,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  btnActive: {
    backgroundColor: "rgba(11,132,255,0.18)",
  },
  btnDanger: {
    backgroundColor: colors.danger,
    minWidth: 64,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.textInverse,
    fontWeight: "500",
    textAlign: "center",
  },
  labelActive: {
    color: colors.primary,
  },
  labelDanger: {
    color: "#fff",
  },
});
