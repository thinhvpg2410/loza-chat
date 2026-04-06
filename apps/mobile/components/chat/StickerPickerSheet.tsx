import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import type { MockSticker } from "./mockStickers";
import { MOCK_STICKERS } from "./mockStickers";
import { colors, radius, spacing } from "@theme";

type StickerPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (sticker: MockSticker) => void;
};

const COLS = 4;

export function StickerPickerSheet({ visible, onClose, onPick }: StickerPickerSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
        <AppText variant="subhead" style={styles.title}>
          Sticker
        </AppText>
        <FlatList
          data={MOCK_STICKERS}
          keyExtractor={(item) => item.id}
          numColumns={COLS}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.emoji}
              onPress={() => {
                onPick(item);
                onClose();
              }}
              style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
            >
              {item.url ? (
                <Image source={{ uri: item.url }} style={styles.img} contentFit="contain" />
              ) : (
                <AppText style={styles.fallbackEmoji}>{item.emoji}</AppText>
              )}
            </Pressable>
          )}
        />
        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.cellPressed]}>
          <AppText variant="subhead" color="textSecondary" style={{ fontWeight: "600" }}>
            Đóng
          </AppText>
        </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const CELL = 72;

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
    maxHeight: "52%",
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: spacing.sm,
    color: colors.text,
  },
  list: {
    paddingBottom: spacing.sm,
  },
  columnWrap: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
    justifyContent: "space-between",
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cellPressed: {
    opacity: 0.75,
  },
  img: {
    width: CELL - 12,
    height: CELL - 12,
  },
  fallbackEmoji: {
    fontSize: 40,
    lineHeight: 44,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
});
