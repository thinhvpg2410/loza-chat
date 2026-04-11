import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

export function GroupSharedMediaPlaceholder() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="images-outline" size={16} color={colors.textMuted} />
        <AppText variant="caption" color="textSecondary" style={styles.title}>
          Ảnh, file, link
        </AppText>
      </View>
      <AppText variant="micro" color="textPlaceholder" style={styles.hint}>
        Đồng bộ khi có máy chủ.
      </AppText>
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.tile} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 16,
  },
  hint: {
    marginTop: 2,
    marginBottom: spacing.xs,
    lineHeight: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  tile: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceSecondary,
  },
});
