import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";

import { GroupMemberPickerModal, SelectedMemberChips } from "@components/group";
import type { PickableMember } from "@components/group";
import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import { MOCK_FRIENDS } from "@/constants/mockData";
import { colors, radius, spacing } from "@theme";

const pickables: PickableMember[] = MOCK_FRIENDS.map((f) => ({
  id: f.id,
  name: f.name,
  avatarUrl: f.avatarUrl,
  subtitle: f.username ? `@${f.username}` : undefined,
}));

export default function CreateGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedMembers = useMemo(
    () => MOCK_FRIENDS.filter((f) => selectedIds.has(f.id)).map((f) => ({ id: f.id, name: f.name })),
    [selectedIds],
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const removeChip = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const canCreate = name.trim().length > 0 && selectedIds.size > 0;

  const onCreate = useCallback(() => {
    if (!canCreate) return;
    Alert.alert("Đã tạo nhóm", `“${name.trim()}” — ${selectedIds.size} thành viên (mock).`, [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  }, [canCreate, name, router, selectedIds.size]);

  return (
    <AppTabScreen edges={["top", "left", "right", "bottom"]}>
      <ShellHeader
        title="Tạo nhóm"
        bottomPadding={spacing.xs}
        left={
          <Pressable
            accessibilityLabel="Đóng"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
          >
            <AppText variant="subhead" color="primary" style={{ fontWeight: "600" }}>
              Hủy
            </AppText>
          </Pressable>
        }
        right={
          <Pressable
            accessibilityLabel="Tạo"
            hitSlop={8}
            disabled={!canCreate}
            onPress={onCreate}
            style={({ pressed }) => ({ opacity: !canCreate ? 0.35 : pressed ? 0.65 : 1, padding: spacing.xs })}
          >
            <AppText variant="subhead" color="primary" style={{ fontWeight: "700" }}>
              Tạo
            </AppText>
          </Pressable>
        }
      />

      <View style={styles.fieldBlock}>
        <AppText variant="caption" color="textMuted" style={styles.label}>
          Tên nhóm
        </AppText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nhập tên nhóm"
          placeholderTextColor={colors.textPlaceholder}
          style={styles.input}
          maxLength={80}
        />
      </View>

      <View style={styles.memberHeader}>
        <AppText variant="caption" color="textMuted" style={styles.label}>
          Thành viên
        </AppText>
        <Pressable onPress={() => setPickerOpen(true)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <AppText variant="subhead" color="primary" style={{ fontWeight: "600" }}>
            + Chọn
          </AppText>
        </Pressable>
      </View>

      <SelectedMemberChips members={selectedMembers} onRemove={removeChip} />

      <FlatList
        data={MOCK_FRIENDS}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listHint}
        ListHeaderComponent={
          <AppText variant="micro" color="textPlaceholder" style={{ marginBottom: spacing.sm }}>
            Hoặc chọn nhanh bên dưới (mock).
          </AppText>
        }
        renderItem={({ item }) => {
          const on = selectedIds.has(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              style={({ pressed }) => [styles.quickRow, pressed && { backgroundColor: colors.surface }]}
            >
              <AppText variant="headline" numberOfLines={1} style={{ flex: 1, fontWeight: "600" }}>
                {item.name}
              </AppText>
              <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={22} color={on ? colors.primary : colors.textMuted} />
            </Pressable>
          );
        }}
      />

      <GroupMemberPickerModal
        visible={pickerOpen}
        title="Chọn thành viên"
        items={pickables}
        selectedIds={selectedIds}
        onToggle={toggle}
        onClose={() => setPickerOpen(false)}
      />
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  label: {
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.chatBubbleIncomingBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  listHint: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
