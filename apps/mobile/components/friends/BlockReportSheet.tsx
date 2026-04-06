import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

type BlockReportSheetProps = {
  visible: boolean;
  userName: string;
  onClose: () => void;
  onBlock: () => void;
  onReport: () => void;
};

export function BlockReportSheet({ visible, userName, onClose, onBlock, onReport }: BlockReportSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
          <AppText variant="micro" color="textMuted" style={styles.title}>
            {userName}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chặn"
            onPress={() => {
              onBlock();
              onClose();
            }}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Ionicons name="ban-outline" size={20} color={colors.danger} />
            <AppText variant="subhead" style={styles.dangerLabel}>
              Chặn
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Báo cáo"
            onPress={() => {
              onReport();
              onClose();
            }}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Ionicons name="flag-outline" size={20} color={colors.text} />
            <AppText variant="subhead" style={styles.label}>
              Báo cáo
            </AppText>
          </Pressable>
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
  title: {
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
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
  dangerLabel: {
    fontWeight: "500",
    color: colors.danger,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
});
