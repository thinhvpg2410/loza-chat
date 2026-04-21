import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";

import { GroupMemberPickerModal, SelectedMemberChips } from "@components/group";
import type { PickableMember } from "@components/group";
import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import { MOCK_FRIENDS } from "@/constants/mockData";
import { fetchFriendsListApi } from "@/services/friends/friendsApi";
import { createGroupApi } from "@/services/groups/groupsApi";
import { attachmentPublicReadUrl } from "@/services/media/publicMediaUrl";
import { uploadLocalFileToAttachment } from "@/services/uploads/directUpload";
import { colors, radius, spacing } from "@theme";

const mockPickables: PickableMember[] = MOCK_FRIENDS.map((f) => ({
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
  const [apiFriends, setApiFriends] = useState<PickableMember[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupAvatarUri, setGroupAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (USE_API_MOCK) return;
    let cancelled = false;
    setFriendsLoading(true);
    void fetchFriendsListApi()
      .then((list) => {
        if (cancelled) return;
        setApiFriends(
          list.map((f) => ({
            id: f.id,
            name: f.displayName,
            avatarUrl: f.avatarUrl ?? undefined,
            subtitle: f.username ? `@${f.username}` : undefined,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setApiFriends([]);
      })
      .finally(() => {
        if (!cancelled) setFriendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pickables = USE_API_MOCK ? mockPickables : apiFriends;

  const quickList = useMemo(
    () =>
      USE_API_MOCK
        ? MOCK_FRIENDS.map((f) => ({ id: f.id, label: f.name }))
        : apiFriends.map((f) => ({ id: f.id, label: f.name })),
    [apiFriends],
  );

  const selectedMembers = useMemo(() => {
    if (USE_API_MOCK) {
      return MOCK_FRIENDS.filter((f) => selectedIds.has(f.id)).map((f) => ({ id: f.id, name: f.name }));
    }
    return apiFriends.filter((f) => selectedIds.has(f.id)).map((f) => ({ id: f.id, name: f.name }));
  }, [selectedIds, apiFriends]);

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

  const canCreate = name.trim().length > 0 && selectedIds.size >= 2 && !creating;

  const pickGroupAvatar = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Quyền truy cập", "Cần quyền thư viện ảnh để chọn ảnh nhóm.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (uri) setGroupAvatarUri(uri);
  }, []);

  const onCreate = useCallback(() => {
    if (!canCreate) return;
    if (USE_API_MOCK) {
      if (selectedIds.size < 2) {
        Alert.alert("Thiếu thành viên", "Chọn ít nhất 2 thành viên để tạo nhóm.");
        return;
      }
      Alert.alert("Đã tạo nhóm", `“${name.trim()}” — ${selectedIds.size} thành viên (mock).`, [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }
    setCreating(true);
    void (async () => {
      try {
        let avatarUrl: string | undefined;
        if (groupAvatarUri) {
          const att = await uploadLocalFileToAttachment({
            fileUri: groupAvatarUri,
            fileName: "group-avatar.jpg",
            mimeType: "image/jpeg",
            uploadType: "image",
          });
          avatarUrl = attachmentPublicReadUrl(att);
        }
        const res = await createGroupApi({
          title: name.trim(),
          memberIds: [...selectedIds],
          ...(avatarUrl ? { avatarUrl } : {}),
        });
        router.replace({
          pathname: "/main/chat/[id]",
          params: {
            id: res.group.conversationId,
            title: encodeURIComponent(res.group.title ?? name.trim()),
          },
        });
      } catch (e) {
        const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message;
        Alert.alert("Lỗi", String(msg ?? (e instanceof Error ? e.message : "Không tạo được nhóm.")));
      } finally {
        setCreating(false);
      }
    })();
  }, [canCreate, groupAvatarUri, name, router, selectedIds]);

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
            disabled={!canCreate || creating}
            onPress={onCreate}
            style={({ pressed }) => ({
              opacity: !canCreate || creating ? 0.35 : pressed ? 0.65 : 1,
              padding: spacing.xs,
            })}
          >
            {creating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <AppText variant="subhead" color="primary" style={{ fontWeight: "700" }}>
                Tạo
              </AppText>
            )}
          </Pressable>
        }
      />

      <View style={[styles.fieldBlock, { flexDirection: "row", alignItems: "center", gap: spacing.md }]}>
        <Pressable
          onPress={() => void pickGroupAvatar()}
          style={({ pressed }) => [styles.avatarPick, pressed && { opacity: 0.85 }]}
        >
          {groupAvatarUri ? (
            <Image source={{ uri: groupAvatarUri }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <View style={[styles.avatarImg, styles.avatarPh]}>
              <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
            </View>
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="micro" color="textMuted">
            Ảnh nhóm (tùy chọn, crop vuông)
          </AppText>
          {groupAvatarUri ? (
            <Pressable onPress={() => setGroupAvatarUri(null)} style={{ marginTop: 4 }}>
              <AppText variant="caption" color="primary" style={{ fontWeight: "600" }}>
                Bỏ ảnh
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

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

      {friendsLoading && !USE_API_MOCK ? (
        <View style={{ padding: spacing.md }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      <FlatList
        data={quickList}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listHint}
        ListHeaderComponent={
          <AppText variant="micro" color="textPlaceholder" style={{ marginBottom: spacing.sm }}>
            {USE_API_MOCK
              ? "Hoặc chọn nhanh bên dưới (mock). Cần ít nhất 2 thành viên."
              : "Chọn bạn bè — tối thiểu 2 thành viên để tạo nhóm."}
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
                {item.label}
              </AppText>
              <Ionicons
                name={on ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={on ? colors.primary : colors.textMuted}
              />
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
  avatarPick: {},
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceSecondary,
  },
  avatarPh: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderStyle: "dashed",
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
