import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import {
  GroupMemberPickerModal,
  GroupMemberRow,
  GroupOnOffBadge,
  GroupPendingTag,
  GroupRoleBadge,
  GroupSharedMediaPlaceholder,
  GroupYesNoBadge,
} from "@components/group";
import type { PickableMember } from "@components/group";
import { AppTabScreen, ShellHeader } from "@components/shell";
import { AppInput } from "@ui/AppInput";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import { MOCK_FRIENDS } from "@/constants/mockData";
import {
  buildGroupPermissionFlags,
  getGroupDetail,
  type GroupMember,
  type GroupMemberRole,
} from "@features/group";
import { getApiErrorMessage } from "@/services/api/api";
import { fetchFriendsListApi } from "@/services/friends/friendsApi";
import {
  addGroupMembersApi,
  approveGroupMemberApi,
  dissolveGroupApi,
  fetchGroupDetailApi,
  fetchGroupJoinQueueApi,
  leaveGroupApi,
  patchGroupProfileApi,
  rejectGroupMemberApi,
  removeGroupMemberApi,
  transferGroupOwnershipApi,
  updateGroupMemberRoleApi,
  updateGroupSettingsApi,
  type GroupDetailDto,
  type GroupJoinQueueItemDto,
  type GroupMemberDto,
} from "@/services/groups/groupsApi";
import { attachmentPublicReadUrl } from "@/services/media/publicMediaUrl";
import { subscribeGroupRoomEvents } from "@/services/socket/socket";
import { uploadLocalFileToAttachment } from "@/services/uploads/directUpload";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { colors, spacing } from "@theme";

function decodeParam(v: string | string[] | undefined): string {
  if (typeof v !== "string") return "";
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function asGroupMemberRole(r: string): GroupMemberRole {
  if (r === "owner" || r === "admin" || r === "member") return r;
  return "member";
}

function mapDtoToRow(m: GroupMemberDto): GroupMember {
  return {
    id: m.userId,
    name: m.user.displayName,
    avatarUrl: m.user.avatarUrl ?? "",
    role: asGroupMemberRole(m.role),
  };
}

export default function GroupInfoScreen() {
  const router = useRouter();
  const viewerId = useAuthStore((s) => s.user?.id ?? "");
  const params = useLocalSearchParams<{ id?: string; name?: string; title?: string; avatarUrl?: string }>();
  const rawId = params.id;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId) ?? "";

  const lastGroupDissolved = useChatStore((s) => s.lastGroupDissolved);
  const lastDissolveHandledSeq = useRef(0);
  useEffect(() => {
    if (USE_API_MOCK) return;
    if (!id) return;
    if (!lastGroupDissolved || lastGroupDissolved.conversationId !== id) return;
    if (lastGroupDissolved.seq <= lastDissolveHandledSeq.current) return;
    lastDissolveHandledSeq.current = lastGroupDissolved.seq;
    router.back();
  }, [lastGroupDissolved, id, router]);

  const nameP = decodeParam(params.name) || decodeParam(params.title);
  const avatarP = decodeParam(params.avatarUrl);

  const mockDetail = useMemo(() => (USE_API_MOCK ? getGroupDetail(id) : null), [id]);

  const mockTitle = mockDetail?.name ?? nameP ?? "Nhóm";
  const mockAvatarUrl = mockDetail?.avatarUrl ?? avatarP;
  const [mockMembers, setMockMembers] = useState<GroupMember[]>(() => mockDetail?.members ?? []);

  const [apiDetail, setApiDetail] = useState<GroupDetailDto | null>(null);
  const [apiLoading, setApiLoading] = useState(!USE_API_MOCK);
  const [apiError, setApiError] = useState<string | null>(null);

  const [apiFriends, setApiFriends] = useState<PickableMember[]>([]);
  const [joinQueue, setJoinQueue] = useState<GroupJoinQueueItemDto[]>([]);
  const [joinQueueLoading, setJoinQueueLoading] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferPick, setTransferPick] = useState<string | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [titleBusy, setTitleBusy] = useState(false);

  const permissions = useMemo(
    () => (apiDetail && viewerId ? buildGroupPermissionFlags(apiDetail, viewerId) : null),
    [apiDetail, viewerId],
  );

  const refreshApiDetail = useCallback(async () => {
    if (USE_API_MOCK || !id) return;
    setApiError(null);
    setApiLoading(true);
    try {
      const { group } = await fetchGroupDetailApi(id);
      setApiDetail(group);
    } catch (e) {
      setApiDetail(null);
      setApiError(getApiErrorMessage(e));
    } finally {
      setApiLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (USE_API_MOCK) return;
    void refreshApiDetail();
  }, [refreshApiDetail]);

  const loadJoinQueue = useCallback(async () => {
    if (USE_API_MOCK || !id || !permissions?.canModerateMembers) {
      setJoinQueue([]);
      return;
    }
    setJoinQueueLoading(true);
    try {
      const { items } = await fetchGroupJoinQueueApi(id);
      setJoinQueue(items);
    } catch {
      setJoinQueue([]);
    } finally {
      setJoinQueueLoading(false);
    }
  }, [id, permissions?.canModerateMembers]);

  useEffect(() => {
    void loadJoinQueue();
  }, [loadJoinQueue]);

  useEffect(() => {
    if (USE_API_MOCK || !id) return () => {};
    return subscribeGroupRoomEvents((ev) => {
      if (ev.conversationId !== id) return;
      void refreshApiDetail();
      void loadJoinQueue();
    });
  }, [id, loadJoinQueue, refreshApiDetail]);

  useEffect(() => {
    if (USE_API_MOCK) return;
    let cancelled = false;
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
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!USE_API_MOCK) return;
    setMockMembers(mockDetail?.members ?? []);
  }, [mockDetail]);

  const title = USE_API_MOCK ? mockTitle : (apiDetail?.title ?? nameP ?? "Nhóm");
  const avatarUrl = USE_API_MOCK ? mockAvatarUrl : (apiDetail?.avatarUrl ?? avatarP);

  const members = USE_API_MOCK ? mockMembers : (apiDetail?.members ?? []).map(mapDtoToRow);
  const pendingDtos = !USE_API_MOCK && apiDetail ? apiDetail.pendingMembers : [];

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const pendingIds = useMemo(() => new Set(pendingDtos.map((p) => p.userId)), [pendingDtos]);

  const addCandidates: PickableMember[] = useMemo(() => {
    if (USE_API_MOCK) {
      return MOCK_FRIENDS.filter((f) => !memberIds.has(f.id)).map((f) => ({
        id: f.id,
        name: f.name,
        avatarUrl: f.avatarUrl,
        subtitle: f.username ? `@${f.username}` : undefined,
      }));
    }
    return apiFriends.filter((f) => !memberIds.has(f.id) && !pendingIds.has(f.id));
  }, [USE_API_MOCK, apiFriends, memberIds, pendingIds]);

  const canAddMembersApi = useMemo(() => {
    if (USE_API_MOCK || !apiDetail) return false;
    if (apiDetail.myStatus !== "active") return false;
    if (apiDetail.settings.onlyAdminsCanAddMembers) {
      return apiDetail.myRole === "owner" || apiDetail.myRole === "admin";
    }
    return true;
  }, [apiDetail]);

  const canModeratePending = apiDetail?.myRole === "owner" || apiDetail?.myRole === "admin";

  const [muted, setMuted] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addSelected, setAddSelected] = useState<Set<string>>(() => new Set());
  const toggleAdd = useCallback((mid: string) => {
    setAddSelected((prev) => {
      const n = new Set(prev);
      if (n.has(mid)) n.delete(mid);
      else n.add(mid);
      return n;
    });
  }, []);

  const applyAddMembers = useCallback(async () => {
    const ids = [...addSelected];
    if (!ids.length) return;
    if (USE_API_MOCK) {
      const toAdd = MOCK_FRIENDS.filter((f) => addSelected.has(f.id));
      if (!toAdd.length) return;
      setMockMembers((prev) => [
        ...prev,
        ...toAdd.map((f) => ({
          id: f.id,
          name: f.name,
          avatarUrl: f.avatarUrl,
          role: "member" as const,
        })),
      ]);
      Alert.alert("Đã thêm", `${toAdd.length} thành viên (mock).`);
      setAddOpen(false);
      setAddSelected(new Set());
      return;
    }
    if (!id) return;
    try {
      await addGroupMembersApi(id, ids);
      setAddOpen(false);
      setAddSelected(new Set());
      await refreshApiDetail();
    } catch (e) {
      Alert.alert("Thêm thành viên", getApiErrorMessage(e));
    }
  }, [USE_API_MOCK, addSelected, id, refreshApiDetail]);

  const onRemoveMemberMock = useCallback((memberId: string) => {
    setMockMembers((prev) => prev.filter((m) => m.id !== memberId));
    Alert.alert("Đã xóa", "Thành viên đã được xóa khỏi nhóm (mock).");
  }, []);

  const onManageMemberApi = useCallback(
    (memberId: string) => {
      if (!apiDetail || !viewerId) return;
      const row = apiDetail.members.find((m) => m.userId === memberId);
      if (!row || row.userId === viewerId) return;

      const targetRole = asGroupMemberRole(row.role);
      const viewerRole = apiDetail.myRole;
      const name = row.user.displayName;

      const actions: { text: string; style?: "destructive" | "cancel"; onPress?: () => void }[] = [];

      if (viewerRole === "owner") {
        if (targetRole === "member") {
          actions.push({
            text: "Đặt làm phó nhóm",
            onPress: () => {
              void (async () => {
                try {
                  await updateGroupMemberRoleApi(id, memberId, "admin");
                  await refreshApiDetail();
                } catch (e) {
                  Alert.alert("Phân quyền", getApiErrorMessage(e));
                }
              })();
            },
          });
        }
        if (targetRole === "admin") {
          actions.push({
            text: "Hạ xuống thành viên",
            onPress: () => {
              void (async () => {
                try {
                  await updateGroupMemberRoleApi(id, memberId, "member");
                  await refreshApiDetail();
                } catch (e) {
                  Alert.alert("Phân quyền", getApiErrorMessage(e));
                }
              })();
            },
          });
        }
        actions.push({
          text: "Chuyển quyền trưởng nhóm",
          onPress: () => {
            Alert.alert(
              "Chuyển quyền trưởng nhóm",
              `${name} sẽ trở thành trưởng nhóm. Bạn sẽ là thành viên.`,
              [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Chuyển",
                  onPress: () => {
                    void (async () => {
                      try {
                        await transferGroupOwnershipApi(id, memberId);
                        await refreshApiDetail();
                      } catch (e) {
                        Alert.alert("Chuyển quyền", getApiErrorMessage(e));
                      }
                    })();
                  },
                },
              ],
            );
          },
        });
      }

      const mayRemove =
        (viewerRole === "owner" || viewerRole === "admin") &&
        targetRole !== "owner" &&
        !(viewerRole === "admin" && targetRole === "admin");

      if (mayRemove) {
        actions.push({
          text: "Xóa khỏi nhóm",
          style: "destructive",
          onPress: () => {
            Alert.alert("Xóa khỏi nhóm", `Xóa ${name} khỏi nhóm?`, [
              { text: "Hủy", style: "cancel" },
              {
                text: "Xóa",
                style: "destructive",
                onPress: () => {
                  void (async () => {
                    try {
                      await removeGroupMemberApi(id, memberId);
                      await refreshApiDetail();
                      void loadJoinQueue();
                    } catch (e) {
                      Alert.alert("Xóa thành viên", getApiErrorMessage(e));
                    }
                  })();
                },
              },
            ]);
          },
        });
      }

      actions.push({ text: "Hủy", style: "cancel" });

      Alert.alert(name, undefined, actions);
    },
    [apiDetail, id, loadJoinQueue, refreshApiDetail, viewerId],
  );

  const onApprove = useCallback(
    (userId: string) => {
      if (USE_API_MOCK) return;
      void (async () => {
        try {
          await approveGroupMemberApi(id, userId);
          await refreshApiDetail();
        } catch (e) {
          Alert.alert("Duyệt thành viên", getApiErrorMessage(e));
        }
      })();
    },
    [USE_API_MOCK, id, refreshApiDetail],
  );

  const onReject = useCallback(
    (userId: string) => {
      if (USE_API_MOCK) return;
      void (async () => {
        try {
          await rejectGroupMemberApi(id, userId);
          await refreshApiDetail();
        } catch (e) {
          Alert.alert("Từ chối", getApiErrorMessage(e));
        }
      })();
    },
    [USE_API_MOCK, id, refreshApiDetail],
  );

  const otherActiveMemberCount = useMemo(() => {
    if (!apiDetail || !viewerId) return 0;
    return apiDetail.members.filter((m) => m.status === "active" && m.userId !== viewerId).length;
  }, [apiDetail, viewerId]);

  const leaveGroup = useCallback(() => {
    if (USE_API_MOCK) {
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
      return;
    }
    if (!apiDetail) return;
    const isOwner = apiDetail.myRole === "owner";
    if (isOwner && otherActiveMemberCount === 0) {
      Alert.alert(
        "Giải tán nhóm?",
        "Bạn là thành viên hoạt động cuối cùng. Giải tán để đóng nhóm, hoặc hủy và mời thêm người.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Giải tán",
            style: "destructive",
            onPress: () => {
              void (async () => {
                try {
                  await dissolveGroupApi(id);
                  router.back();
                } catch (e) {
                  Alert.alert("Giải tán", getApiErrorMessage(e));
                }
              })();
            },
          },
        ],
      );
      return;
    }
    if (isOwner && otherActiveMemberCount > 0) {
      const first =
        apiDetail.members.find((m) => m.status === "active" && m.userId !== viewerId)?.userId ?? null;
      setTransferPick(first);
      setTransferOpen(true);
      return;
    }
    Alert.alert("Rời nhóm", "Bạn sẽ không nhận tin nhắn từ nhóm này.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Rời nhóm",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await leaveGroupApi(id);
              router.back();
            } catch (e) {
              Alert.alert("Rời nhóm", getApiErrorMessage(e));
            }
          })();
        },
      },
    ]);
  }, [USE_API_MOCK, apiDetail, id, otherActiveMemberCount, router, viewerId]);

  const dissolveGroup = useCallback(() => {
    if (USE_API_MOCK || apiDetail?.myRole !== "owner") return;
    Alert.alert(
      "Giải tán nhóm",
      "Mọi thành viên sẽ mất cuộc trò chuyện này. Thao tác không hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Giải tán",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await dissolveGroupApi(id);
                router.back();
              } catch (e) {
                Alert.alert("Giải tán nhóm", getApiErrorMessage(e));
              }
            })();
          },
        },
      ],
    );
  }, [USE_API_MOCK, apiDetail?.myRole, id, router]);

  const onSearch = useCallback(() => {
    Alert.alert("Tìm trong nhóm", "Kết nối tìm kiếm khi có API.");
  }, []);

  const openRenameGroup = useCallback(() => {
    if (USE_API_MOCK || !permissions?.canRenameGroup) return;
    setRenameDraft(title);
    setRenameOpen(true);
  }, [USE_API_MOCK, permissions?.canRenameGroup, title]);

  const applyRenameGroup = useCallback(async () => {
    if (USE_API_MOCK || !id) return;
    const next = renameDraft.trim();
    if (!next) {
      Alert.alert("Đổi tên nhóm", "Tên không được để trống.");
      return;
    }
    if (next === (apiDetail?.title ?? "").trim()) {
      setRenameOpen(false);
      return;
    }
    setTitleBusy(true);
    try {
      const { group } = await patchGroupProfileApi({ conversationId: id, title: next });
      setApiDetail(group);
      setRenameOpen(false);
    } catch (e) {
      Alert.alert("Đổi tên nhóm", getApiErrorMessage(e));
    } finally {
      setTitleBusy(false);
    }
  }, [USE_API_MOCK, apiDetail?.title, id, renameDraft]);

  const changeGroupAvatar = useCallback(async () => {
    if (USE_API_MOCK || !id || !permissions?.canEditGroupAvatar) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Quyền truy cập", "Cần quyền thư viện ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const uri = asset?.uri;
    if (!uri) return;
    setAvatarBusy(true);
    try {
      const att = await uploadLocalFileToAttachment({
        fileUri: uri,
        fileName: "group-avatar.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
        uploadType: "image",
        width: asset.width,
        height: asset.height,
      });
      const url = attachmentPublicReadUrl(att);
      await patchGroupProfileApi({ conversationId: id, avatarUrl: url });
      await refreshApiDetail();
    } catch (e) {
      Alert.alert("Đổi ảnh nhóm", getApiErrorMessage(e));
    } finally {
      setAvatarBusy(false);
    }
  }, [USE_API_MOCK, id, permissions?.canEditGroupAvatar, refreshApiDetail]);

  const showAddControl = USE_API_MOCK || canAddMembersApi;

  const transferCandidates = useMemo(() => {
    if (!apiDetail || !viewerId) return [];
    return apiDetail.members.filter((m) => m.status === "active" && m.userId !== viewerId);
  }, [apiDetail, viewerId]);

  if (!USE_API_MOCK && apiLoading && !apiDetail) {
    return (
      <AppTabScreen edges={["top", "left", "right", "bottom"]}>
        <ShellHeader title="Thông tin nhóm" bottomPadding={spacing.xs} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AppTabScreen>
    );
  }

  if (!USE_API_MOCK && apiError && !apiDetail) {
    return (
      <AppTabScreen edges={["top", "left", "right", "bottom"]}>
        <ShellHeader title="Thông tin nhóm" bottomPadding={spacing.xs} />
        <View style={[styles.centered, { paddingHorizontal: spacing.lg, gap: spacing.sm }]}>
          <AppText variant="subhead" color="textSecondary" style={{ textAlign: "center" }}>
            {apiError}
          </AppText>
          <Pressable
            onPress={() => void refreshApiDetail()}
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <AppText variant="subhead" style={{ color: colors.textInverse, fontWeight: "600" }}>
              Thử lại
            </AppText>
          </Pressable>
        </View>
      </AppTabScreen>
    );
  }

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
          <Pressable
            onPress={() => void changeGroupAvatar()}
            disabled={USE_API_MOCK || !permissions?.canEditGroupAvatar || avatarBusy}
            style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" transition={160} />
            ) : (
              <View style={[styles.avatar, styles.avatarPh]}>
                <Ionicons name="people" size={28} color={colors.primary} />
              </View>
            )}
            {!USE_API_MOCK && permissions?.canEditGroupAvatar ? (
              <AppText variant="micro" color="primary" style={{ marginTop: 4, textAlign: "center" }}>
                Chạm để đổi ảnh
              </AppText>
            ) : null}
          </Pressable>
          {avatarBusy ? <ActivityIndicator style={{ marginTop: 8 }} color={colors.primary} /> : null}
          <Pressable
            onPress={openRenameGroup}
            disabled={USE_API_MOCK || !permissions?.canRenameGroup}
            style={({ pressed }) => ({
              opacity: USE_API_MOCK || !permissions?.canRenameGroup ? 1 : pressed ? 0.85 : 1,
              marginTop: spacing.sm,
            })}
          >
            <AppText variant="headline" style={styles.groupName} numberOfLines={2}>
              {title}
            </AppText>
          </Pressable>
          {!USE_API_MOCK && permissions?.canRenameGroup ? (
            <AppText variant="micro" color="primary" style={{ marginTop: 4, textAlign: "center" }}>
              Chạm tên để đổi
            </AppText>
          ) : null}
          <AppText variant="caption" color="textMuted">
            {members.length} thành viên
          </AppText>
          {!USE_API_MOCK && apiDetail ? (
            <View style={styles.badgeRow}>
              {apiDetail.settings.onlyAdminsCanPost ? (
                <View style={styles.badge}>
                  <AppText variant="micro" style={{ fontWeight: "600", color: "#92400e" }}>
                    Hạn chế chat
                  </AppText>
                </View>
              ) : null}
              {apiDetail.settings.joinApprovalRequired ? (
                <View style={[styles.badge, { backgroundColor: "#e0f2fe" }]}>
                  <AppText variant="micro" style={{ fontWeight: "600", color: "#075985" }}>
                    Duyệt vào nhóm
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {!USE_API_MOCK && apiDetail ? (
          <View style={styles.identityBlock}>
            {apiDetail.myStatus === "pending" ? (
              <View style={styles.pendingSelfBanner}>
                <Ionicons name="time-outline" size={18} color="#92400e" />
                <AppText variant="subhead" style={{ flex: 1, fontWeight: "600", color: "#92400e" }}>
                  Bạn đang chờ trưởng nhóm / phó duyệt để tham gia nhóm.
                </AppText>
              </View>
            ) : null}
            <AppText variant="caption" color="textSecondary" style={styles.identityLabel}>
              Vai trò của bạn
            </AppText>
            <GroupRoleBadge role={asGroupMemberRole(apiDetail.myRole)} />
            {permissions?.onlyLeaderDeputyCanChat &&
            permissions.isMemberOnly &&
            apiDetail.myStatus === "active" ? (
              <AppText variant="micro" color="textSecondary" style={{ marginTop: 6 }}>
                Chỉ trưởng nhóm / phó được gửi tin; bạn có thể xem và tương tác theo quy định nhóm.
              </AppText>
            ) : null}
            {!permissions?.canChangeSettings ? (
              <View style={styles.permReadBox}>
                <AppText variant="caption" color="textSecondary" style={styles.sectionTitle}>
                  Quyền nhóm
                </AppText>
                <View style={styles.permReadRow}>
                  <AppText variant="micro" color="textMuted" style={styles.permReadLabel}>
                    Chỉ trưởng/phó gửi tin
                  </AppText>
                  <GroupOnOffBadge on={apiDetail.settings.onlyAdminsCanPost} />
                </View>
                <View style={styles.permReadRow}>
                  <AppText variant="micro" color="textMuted" style={styles.permReadLabel}>
                    Duyệt khi vào nhóm
                  </AppText>
                  <GroupOnOffBadge on={apiDetail.settings.joinApprovalRequired} />
                </View>
                <View style={styles.permReadRow}>
                  <AppText variant="micro" color="textMuted" style={styles.permReadLabel}>
                    Trưởng/phó thu hồi tin TV
                  </AppText>
                  <GroupOnOffBadge on={Boolean(apiDetail.settings.moderatorsCanRecallMessages)} />
                </View>
                <View style={styles.permReadRow}>
                  <AppText variant="micro" color="textMuted" style={styles.permReadLabel}>
                    Chỉ trưởng/phó thêm TV
                  </AppText>
                  <GroupOnOffBadge on={Boolean(apiDetail.settings.onlyAdminsCanAddMembers)} />
                </View>
                <View style={styles.permReadRow}>
                  <AppText variant="micro" color="textMuted" style={styles.permReadLabel}>
                    Chỉ trưởng/phó xóa TV
                  </AppText>
                  <GroupOnOffBadge on={Boolean(apiDetail.settings.onlyAdminsCanRemoveMembers)} />
                </View>
              </View>
            ) : null}
            {permissions && apiDetail.myStatus === "active" && !permissions.canChangeSettings ? (
              <View style={styles.permReadBox}>
                <AppText variant="caption" color="textSecondary" style={styles.sectionTitle}>
                  Quyền thao tác của bạn
                </AppText>
                <View style={styles.permReadRow}>
                  <AppText variant="micro" color="textMuted" style={styles.permReadLabel}>
                    Mời thêm thành viên
                  </AppText>
                  <GroupYesNoBadge yes={permissions.canAddMembers} />
                </View>
                <View style={styles.permReadRow}>
                  <AppText variant="micro" color="textMuted" style={styles.permReadLabel}>
                    Xóa thành viên
                  </AppText>
                  <GroupYesNoBadge yes={permissions.canRemoveMembers} />
                </View>
                <View style={styles.permReadRow}>
                  <AppText variant="micro" color="textMuted" style={styles.permReadLabel}>
                    Duyệt hàng chờ / TV chờ
                  </AppText>
                  <GroupYesNoBadge yes={permissions.canModerateMembers} />
                </View>
                <View style={styles.permReadRow}>
                  <AppText variant="micro" color="textMuted" style={styles.permReadLabel}>
                    Sửa cài đặt quyền nhóm
                  </AppText>
                  <GroupYesNoBadge yes={permissions.canChangeSettings} />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

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

        {!USE_API_MOCK && apiDetail?.myRole === "owner" ? (
          <Pressable
            accessibilityRole="button"
            onPress={dissolveGroup}
            style={({ pressed }) => [styles.dissolveBtn, pressed && { opacity: 0.88 }]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <AppText variant="caption" style={[styles.actionLabel, { color: colors.danger }]}>
              Giải tán nhóm
            </AppText>
          </Pressable>
        ) : null}

        {!USE_API_MOCK && permissions?.canModerateMembers && id ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/main/group/join-requests", params: { id } })
            }
            style={({ pressed }) => [styles.queueLink, pressed && { opacity: 0.88 }]}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="subhead" style={{ fontWeight: "700" }}>
                Hàng chờ duyệt
              </AppText>
              <AppText variant="micro" color="textMuted">
                {joinQueueLoading ? "Đang tải…" : `${joinQueue.length} mục`}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}

        {!USE_API_MOCK && permissions?.canChangeSettings && apiDetail ? (
          <View style={styles.settingsBox}>
            <AppText variant="caption" color="textSecondary" style={styles.sectionTitle}>
              Cài đặt quyền (trưởng / phó)
            </AppText>
            <View style={styles.switchRow}>
              <AppText variant="subhead" style={{ flex: 1 }}>
                Chỉ trưởng / phó được gửi tin
              </AppText>
              <Switch
                value={apiDetail.settings.onlyAdminsCanPost}
                disabled={settingsBusy}
                onValueChange={(v) => {
                  setSettingsBusy(true);
                  void updateGroupSettingsApi(id, { onlyAdminsCanPost: v })
                    .then((r) => {
                      setApiDetail(r.group);
                    })
                    .catch((e) => Alert.alert("Cài đặt", getApiErrorMessage(e)))
                    .finally(() => setSettingsBusy(false));
                }}
              />
            </View>
            <View style={styles.switchRow}>
              <AppText variant="subhead" style={{ flex: 1 }}>
                Cần duyệt khi vào nhóm
              </AppText>
              <Switch
                value={apiDetail.settings.joinApprovalRequired}
                disabled={settingsBusy}
                onValueChange={(v) => {
                  setSettingsBusy(true);
                  void updateGroupSettingsApi(id, { joinApprovalRequired: v })
                    .then((r) => {
                      setApiDetail(r.group);
                    })
                    .catch((e) => Alert.alert("Cài đặt", getApiErrorMessage(e)))
                    .finally(() => setSettingsBusy(false));
                }}
              />
            </View>
            <View style={styles.switchRow}>
              <AppText variant="subhead" style={{ flex: 1 }}>
                Trưởng / phó thu hồi tin của TV
              </AppText>
              <Switch
                value={Boolean(apiDetail.settings.moderatorsCanRecallMessages)}
                disabled={settingsBusy}
                onValueChange={(v) => {
                  setSettingsBusy(true);
                  void updateGroupSettingsApi(id, { moderatorsCanRecallMessages: v })
                    .then((r) => {
                      setApiDetail(r.group);
                    })
                    .catch((e) => Alert.alert("Cài đặt", getApiErrorMessage(e)))
                    .finally(() => setSettingsBusy(false));
                }}
              />
            </View>
            <View style={styles.switchRow}>
              <AppText variant="subhead" style={{ flex: 1 }}>
                Chỉ trưởng/phó thêm thành viên
              </AppText>
              <Switch
                value={Boolean(apiDetail.settings.onlyAdminsCanAddMembers)}
                disabled={settingsBusy}
                onValueChange={(v) => {
                  setSettingsBusy(true);
                  void updateGroupSettingsApi(id, { onlyAdminsCanAddMembers: v })
                    .then((r) => {
                      setApiDetail(r.group);
                    })
                    .catch((e) => Alert.alert("Cài đặt", getApiErrorMessage(e)))
                    .finally(() => setSettingsBusy(false));
                }}
              />
            </View>
            <View style={styles.switchRow}>
              <AppText variant="subhead" style={{ flex: 1 }}>
                Chỉ trưởng/phó xóa thành viên
              </AppText>
              <Switch
                value={Boolean(apiDetail.settings.onlyAdminsCanRemoveMembers)}
                disabled={settingsBusy}
                onValueChange={(v) => {
                  setSettingsBusy(true);
                  void updateGroupSettingsApi(id, { onlyAdminsCanRemoveMembers: v })
                    .then((r) => {
                      setApiDetail(r.group);
                    })
                    .catch((e) => Alert.alert("Cài đặt", getApiErrorMessage(e)))
                    .finally(() => setSettingsBusy(false));
                }}
              />
            </View>
          </View>
        ) : null}

        {!USE_API_MOCK && pendingDtos.length > 0 && canModeratePending ? (
          <View style={styles.pendingSection}>
            <AppText variant="caption" color="textSecondary" style={styles.sectionTitle}>
              Chờ duyệt ({pendingDtos.length})
            </AppText>
            {pendingDtos.map((p) => (
              <View key={p.userId} style={styles.pendingRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.pendingNameRow}>
                    <AppText variant="subhead" numberOfLines={1} style={styles.pendingName}>
                      {p.user.displayName}
                    </AppText>
                    <GroupPendingTag style={styles.pendingTag} />
                  </View>
                  <AppText variant="micro" color="textMuted">
                    @{p.user.username ?? p.userId}
                  </AppText>
                </View>
                <Pressable
                  onPress={() => onApprove(p.userId)}
                  style={({ pressed }) => [styles.pendingBtn, styles.approveBtn, pressed && { opacity: 0.85 }]}
                >
                  <AppText variant="caption" style={{ fontWeight: "700", color: colors.textInverse }}>
                    Duyệt
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => onReject(p.userId)}
                  style={({ pressed }) => [styles.pendingBtn, styles.rejectBtn, pressed && { opacity: 0.85 }]}
                >
                  <AppText variant="caption" style={{ fontWeight: "700", color: colors.danger }}>
                    Từ chối
                  </AppText>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.memberSectionBar}>
          <AppText variant="caption" color="textSecondary" style={styles.sectionTitle}>
            Thành viên
          </AppText>
          {showAddControl ? (
            <Pressable onPress={() => setAddOpen(true)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
              <AppText variant="caption" color="primary" style={{ fontWeight: "700" }}>
                + Thêm
              </AppText>
            </Pressable>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>

        {members.map((m) => (
          <GroupMemberRow
            key={m.id}
            id={m.id}
            name={m.name}
            avatarUrl={m.avatarUrl}
            role={m.role}
            isSelf={m.id === viewerId}
            canManage={
              USE_API_MOCK
                ? true
                : Boolean(
                    apiDetail?.myStatus === "active" &&
                      (apiDetail.myRole === "owner" || apiDetail.myRole === "admin"),
                  )
            }
            onMenuPress={USE_API_MOCK ? onRemoveMemberMock : undefined}
            onManageMember={!USE_API_MOCK ? onManageMemberApi : undefined}
          />
        ))}

        <GroupSharedMediaPlaceholder />
      </ScrollView>

      <Modal visible={transferOpen} animationType="slide" transparent onRequestClose={() => setTransferOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="headline" style={{ fontWeight: "700" }}>
              Chuyển quyền trưởng nhóm
            </AppText>
            <AppText variant="caption" color="textMuted" style={{ marginTop: 6 }}>
              Chọn thành viên nhận quyền trước khi rời nhóm.
            </AppText>
            <FlatList
              data={transferCandidates}
              keyExtractor={(m) => m.userId}
              style={{ marginTop: spacing.md, maxHeight: 280 }}
              renderItem={({ item }) => {
                const sel = transferPick === item.userId;
                return (
                  <Pressable
                    onPress={() => setTransferPick(item.userId)}
                    style={({ pressed }) => [
                      styles.transferRow,
                      sel && styles.transferRowSel,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <AppText variant="subhead" style={{ fontWeight: "600" }}>
                      {item.user.displayName}
                    </AppText>
                    {sel ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <Pressable
                onPress={() => setTransferOpen(false)}
                style={({ pressed }) => [styles.modalBtnGhost, pressed && { opacity: 0.85 }]}
              >
                <AppText variant="subhead" style={{ fontWeight: "600" }}>
                  Hủy
                </AppText>
              </Pressable>
              <Pressable
                disabled={!transferPick}
                onPress={() => {
                  if (!transferPick || !id) return;
                  void (async () => {
                    try {
                      await transferGroupOwnershipApi(id, transferPick);
                      await leaveGroupApi(id);
                      setTransferOpen(false);
                      router.back();
                    } catch (e) {
                      Alert.alert("Chuyển quyền / rời nhóm", getApiErrorMessage(e));
                    }
                  })();
                }}
                style={({ pressed }) => [
                  styles.modalBtnPrimary,
                  { opacity: !transferPick ? 0.45 : pressed ? 0.88 : 1 },
                ]}
              >
                <AppText variant="subhead" style={{ fontWeight: "700", color: colors.textInverse }}>
                  Chuyển & rời nhóm
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={renameOpen}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!titleBusy) setRenameOpen(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="headline" style={{ fontWeight: "700" }}>
              Đổi tên nhóm
            </AppText>
            <AppInput
              label="Tên nhóm"
              value={renameDraft}
              onChangeText={setRenameDraft}
              maxLength={120}
              editable={!titleBusy}
              containerStyle={{ marginTop: spacing.md }}
            />
            {titleBusy ? (
              <ActivityIndicator style={{ marginTop: spacing.sm }} color={colors.primary} />
            ) : null}
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <Pressable
                disabled={titleBusy}
                onPress={() => setRenameOpen(false)}
                style={({ pressed }) => [
                  styles.modalBtnGhost,
                  pressed && { opacity: 0.85 },
                  titleBusy && { opacity: 0.5 },
                ]}
              >
                <AppText variant="subhead" style={{ fontWeight: "600" }}>
                  Hủy
                </AppText>
              </Pressable>
              <Pressable
                disabled={titleBusy || !renameDraft.trim()}
                onPress={() => void applyRenameGroup()}
                style={({ pressed }) => [
                  styles.modalBtnPrimary,
                  {
                    opacity: !renameDraft.trim() || titleBusy ? 0.45 : pressed ? 0.88 : 1,
                  },
                ]}
              >
                <AppText variant="subhead" style={{ fontWeight: "700", color: colors.textInverse }}>
                  Lưu
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  dissolveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.sm,
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
  pendingSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pendingBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  approveBtn: {
    backgroundColor: colors.primary,
  },
  rejectBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fef3c7",
  },
  identityBlock: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.chatBubbleIncomingBorder,
    gap: spacing.xs,
  },
  identityLabel: {
    fontWeight: "700",
    letterSpacing: 0.2,
    marginTop: spacing.xs,
  },
  pendingSelfBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: "#fef3c7",
    marginBottom: spacing.xs,
  },
  permReadBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 6,
  },
  permReadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  permReadLabel: {
    flex: 1,
    fontWeight: "600",
    lineHeight: 18,
  },
  pendingNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  pendingName: {
    fontWeight: "600",
    flexShrink: 1,
  },
  pendingTag: {
    marginTop: 0,
  },
  queueLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  settingsBox: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
  },
  transferRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 6,
  },
  transferRowSel: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  modalBtnGhost: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalBtnPrimary: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
});
