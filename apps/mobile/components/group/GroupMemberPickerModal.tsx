import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

export type PickableMember = {
  id: string;
  name: string;
  avatarUrl: string;
  subtitle?: string;
};

type GroupMemberPickerModalProps = {
  visible: boolean;
  title: string;
  items: PickableMember[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  /** Called before `onClose` when user taps Xong */
  onDone?: () => void;
  onClose: () => void;
};

export function GroupMemberPickerModal({
  visible,
  title,
  items,
  selectedIds,
  onToggle,
  onDone,
  onClose,
}: GroupMemberPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) setQuery("");
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q.length) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Hủy"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs, minWidth: 48 })}
          >
            <AppText variant="subhead" color="primary" style={{ fontWeight: "600" }}>
              Hủy
            </AppText>
          </Pressable>
          <AppText variant="headline" style={styles.title}>
            {title}
          </AppText>
          <Pressable
            accessibilityLabel="Xong"
            hitSlop={8}
            onPress={() => {
              onDone?.();
              onClose();
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs, minWidth: 48, alignItems: "flex-end" })}
          >
            <AppText variant="subhead" color="primary" style={{ fontWeight: "600" }}>
              Xong
            </AppText>
          </Pressable>
        </View>

        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm"
            placeholderTextColor={colors.textPlaceholder}
            style={styles.input}
            autoCorrect={false}
            {...(Platform.OS === "ios" ? { clearButtonMode: "always" as const } : {})}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
          renderItem={({ item }) => {
            const on = selectedIds.has(item.id);
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => onToggle(item.id)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} contentFit="cover" transition={100} />
                <View style={styles.meta}>
                  <AppText variant="headline" numberOfLines={1} style={styles.name}>
                    {item.name}
                  </AppText>
                  {item.subtitle ? (
                    <AppText variant="caption" color="textPlaceholder" numberOfLines={1}>
                      {item.subtitle}
                    </AppText>
                  ) : null}
                </View>
                <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={22} color={on ? colors.primary : colors.textMuted} />
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.chatBubbleIncomingBorder,
    minHeight: 36,
  },
  input: {
    flex: 1,
    marginLeft: spacing.xs,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.text,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    minHeight: 48,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    marginRight: 10,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: "600",
    fontSize: 15,
  },
});
