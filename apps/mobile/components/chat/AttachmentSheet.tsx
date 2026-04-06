import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

export type AttachmentKind = "photo" | "file" | "sticker" | "camera";

type Row = { id: AttachmentKind; label: string; icon: keyof typeof Ionicons.glyphMap };

const ROWS: Row[] = [
  { id: "photo", label: "Ảnh", icon: "images-outline" },
  { id: "file", label: "Tệp", icon: "document-outline" },
  { id: "sticker", label: "Sticker", icon: "happy-outline" },
  { id: "camera", label: "Camera (placeholder)", icon: "camera-outline" },
];

type AttachmentSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (kind: AttachmentKind) => void;
};

export function AttachmentSheet({ visible, onClose, onPick }: AttachmentSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
        <AppText variant="micro" color="textMuted" style={styles.sheetTitle}>
          Đính kèm
        </AppText>
        {ROWS.map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            onPress={() => {
              onPick(r.id);
              onClose();
            }}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={r.icon} size={22} color={colors.primary} />
            </View>
            <AppText variant="subhead" style={styles.label}>
              {r.label}
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
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sheetTitle: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
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
