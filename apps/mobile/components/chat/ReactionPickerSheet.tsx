import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type ReactionPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
};

export function ReactionPickerSheet({ visible, onClose, onPick }: ReactionPickerSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
        <AppText variant="micro" color="textMuted" style={styles.title}>
          Chọn cảm xúc
        </AppText>
        <View style={styles.row}>
          {EMOJIS.map((e) => (
            <Pressable
              key={e}
              accessibilityRole="button"
              accessibilityLabel={e}
              onPress={() => {
                onPick(e);
                onClose();
              }}
              style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
            >
              <AppText style={styles.emoji}>{e}</AppText>
            </Pressable>
          ))}
        </View>
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cellPressed: {
    opacity: 0.75,
  },
  emoji: {
    fontSize: 26,
    lineHeight: 30,
  },
});
