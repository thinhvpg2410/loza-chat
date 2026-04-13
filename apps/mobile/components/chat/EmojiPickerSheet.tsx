import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

type EmojiPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
};

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🥳", "🤔",
  "😴", "😭", "😡", "👍", "👏", "🙏", "💪", "🔥", "❤️", "💯",
  "✨", "🎉", "🎯", "📷", "📎", "✅", "❌", "🤝", "👋", "👌",
];

const COLS = 6;

export function EmojiPickerSheet({ visible, onClose, onPick }: EmojiPickerSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
          <AppText variant="subhead" style={styles.title}>
            Emoji
          </AppText>
          <FlatList
            data={EMOJIS}
            keyExtractor={(item, index) => `${item}-${index}`}
            numColumns={COLS}
            contentContainerStyle={styles.list}
            columnWrapperStyle={styles.row}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Emoji ${item}`}
                onPress={() => {
                  onPick(item);
                  onClose();
                }}
                style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
              >
                <AppText style={styles.emoji}>{item}</AppText>
              </Pressable>
            )}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.cellPressed]}
          >
            <AppText variant="subhead" color="textSecondary" style={{ fontWeight: "600" }}>
              Đóng
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
    maxHeight: "45%",
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  title: {
    textAlign: "center",
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  cell: {
    width: 46,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  cellPressed: {
    opacity: 0.75,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
});
