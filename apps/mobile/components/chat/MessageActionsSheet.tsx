import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

export type MessageActionId =
  | "reply"
  | "copy"
  | "react"
  | "recall"
  | "delete"
  | "forward"
  | "hide_self";

export type MessageActionItem = {
  id: MessageActionId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
};

const DEFAULT_ACTIONS: MessageActionItem[] = [
  { id: "reply", label: "Trả lời", icon: "arrow-undo-outline" },
  { id: "copy", label: "Sao chép", icon: "copy-outline" },
  { id: "react", label: "Cảm xúc", icon: "happy-outline" },
  { id: "forward", label: "Chuyển tiếp", icon: "arrow-redo-outline" },
  { id: "recall", label: "Thu hồi", icon: "return-up-back-outline", danger: true },
  { id: "delete", label: "Xóa", icon: "trash-outline", danger: true },
];

type MessageActionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onAction: (id: MessageActionId) => void;
  actions?: MessageActionItem[];
};

export function MessageActionsSheet({ visible, onClose, onAction, actions }: MessageActionsSheetProps) {
  const insets = useSafeAreaInsets();
  const items = actions?.length ? actions : DEFAULT_ACTIONS;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
        {items.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            onPress={() => {
              onAction(a.id);
              onClose();
            }}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Ionicons name={a.icon} size={22} color={a.danger ? colors.danger : colors.text} />
            <AppText variant="subhead" style={[styles.label, a.danger && { color: colors.danger }]}>
              {a.label}
            </AppText>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.rowPressed]}>
          <AppText variant="subhead" color="textSecondary" style={{ fontWeight: "600" }}>
            Hủy
          </AppText>
        </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  label: {
    fontWeight: "500",
    color: colors.text,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
});
