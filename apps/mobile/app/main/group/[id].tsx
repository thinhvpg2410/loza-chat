import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { GroupMemberPickerModal, GroupMemberRow, GroupSharedMediaPlaceholder } from "@components/group";
import type { PickableMember } from "@components/group";
import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import { getGroupDetail, type GroupMember } from "@features/group";
import { MOCK_FRIENDS } from "@/constants/mockData";
import { colors, spacing } from "@theme";

function decodeParam(v: string | string[] | undefined): string {
  if (typeof v !== "string") return "";
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export default function GroupInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; title?: string; avatarUrl?: string }>();
  const rawId = params.id;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId) ?? "";

  const nameP = decodeParam(params.name) || decodeParam(params.title);
  const avatarP = decodeParam(params.avatarUrl);

  const detail = useMemo(() => getGroupDetail(id), [id]);

  const title = detail?.name ?? nameP ?? "Nhóm";
  const avatarUrl = detail?.avatarUrl ?? avatarP;
  const [members, setMembers] = useState<GroupMember[]>(() => detail?.members ?? []);
  const [muted, setMuted] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  const addCandidates: PickableMember[] = useMemo(
    () =>
      MOCK_FRIENDS.filter((f) => !memberIds.has(f.id)).map((f) => ({
        id: f.id,
        name: f.name,
        avatarUrl: f.avatarUrl,
        subtitle: f.username ? `@${f.username}` : undefined,
      })),
    [memberIds],
  );

  const [addSelected, setAddSelected] = useState<Set<string>>(() => new Set());

  const toggleAdd = useCallback((mid: string) => {
    setAddSelected((prev) => {
      const n = new Set(prev);
      if (n.has(mid)) n.delete(mid);
      else n.add(mid);
      return n;
    });
  }, []);

  const applyAddMembers = useCallback(() => {
    const toAdd = MOCK_FRIENDS.filter((f) => addSelected.has(f.id));
    if (!toAdd.length) return;
    setMembers((prev) => [
      ...prev,
      ...toAdd.map((f) => ({
        id: f.id,
        name: f.name,
        avatarUrl: f.avatarUrl,
        role: "member" as const,
      })),
    ]);
    Alert.alert("Đã thêm", `${toAdd.length} thành viên (mock).`);
  }, [addSelected]);

  const onRemoveMember = useCallback((memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    Alert.alert("Đã xóa", "Thành viên đã được xóa khỏi nhóm (mock).");
  }, []);

  const leaveGroup = useCallback(() => {
    Alert.alert("Rời nhóm", "Bạn sẽ không nhận tin nhắn từ nhóm này.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Rời nhóm",
        style: "destructive",
        onPress: () => {
          Alert.alert("Đã rời nhóm", undefined, [{ text: "OK", onPress: () => router.back() }]);
        },
      },
    ]);
  }, [router]);

  const onSearch = useCallback(() => {
    Alert.alert("Tìm trong nhóm", "Kết nối tìm kiếm khi có API.");
  }, []);

  return (
    <AppTabScreen edges={["top", "left", "right", "bottom"]}>
      <ShellHeader
        title="Thông tin nhóm"
        bottomPadding={spacing.xs}
        left={
          <Pressable
            accessibilityLabel="Quay lại"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: spacing.xs })}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" transition={160} />
          ) : (
            <View style={[styles.avatar, styles.avatarPh]}>
              <Ionicons name="people" size={28} color={colors.primary} />
            </View>
          )}
          <AppText variant="headline" style={styles.groupName} numberOfLines={2}>
            {title}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {members.length} thành viên
          </AppText>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMuted((m) => !m)}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.88 }]}
          >
            <Ionicons name={muted ? "volume-mute" : "volume-high-outline"} size={18} color={colors.text} />
            <AppText variant="caption" style={styles.actionLabel}>
              {muted ? "Bật TB" : "Tắt TB"}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSearch}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.88 }]}
          >
            <Ionicons name="search-outline" size={18} color={colors.text} />
            <AppText variant="caption" style={styles.actionLabel}>
              Tìm
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={leaveGroup}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.88 }]}
          >
            <Ionicons name="exit-outline" size={18} color={colors.danger} />
            <AppText variant="caption" style={[styles.actionLabel, { color: colors.danger }]}>
              Rời nhóm
            </AppText>
          </Pressable>
        </View>

        <View style={styles.memberSectionBar}>
          <AppText variant="caption" color="textSecondary" style={styles.sectionTitle}>
            Thành viên
          </AppText>
          <Pressable onPress={() => setAddOpen(true)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
            <AppText variant="caption" color="primary" style={{ fontWeight: "700" }}>
              + Thêm
            </AppText>
          </Pressable>
        </View>

        {members.map((m) => (
          <GroupMemberRow
            key={m.id}
            id={m.id}
            name={m.name}
            avatarUrl={m.avatarUrl}
            role={m.role}
            onMenuPress={onRemoveMember}
          />
        ))}

        <GroupSharedMediaPlaceholder />
      </ScrollView>

      <GroupMemberPickerModal
        visible={addOpen}
        title="Thêm thành viên"
        items={addCandidates}
        selectedIds={addSelected}
        onToggle={toggleAdd}
        onDone={applyAddMembers}
        onClose={() => {
          setAddOpen(false);
          setAddSelected(new Set());
        }}
      />
    </AppTabScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.chatBubbleIncomingBorder,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSecondary,
  },
  avatarPh: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryMuted,
  },
  groupName: {
    marginTop: spacing.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.chatBubbleIncomingBorder,
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
    minWidth: 72,
  },
  actionLabel: {
    fontWeight: "600",
    fontSize: 11,
    lineHeight: 14,
  },
  memberSectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
