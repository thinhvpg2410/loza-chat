import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

export type ChipMember = { id: string; name: string };

type SelectedMemberChipsProps = {
  members: ChipMember[];
  onRemove: (id: string) => void;
};

export function SelectedMemberChips({ members, onRemove }: SelectedMemberChipsProps) {
  if (!members.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {members.map((m) => (
        <View key={m.id} style={styles.chip}>
          <AppText variant="caption" numberOfLines={1} style={styles.chipText}>
            {m.name}
          </AppText>
          <Pressable
            accessibilityLabel={`Xóa ${m.name}`}
            hitSlop={6}
            onPress={() => onRemove(m.id)}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: 2 })}
          >
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 160,
    paddingLeft: spacing.sm,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    gap: 4,
  },
  chipText: {
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
  },
});
