import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";

import { AuthHeader } from "@components/auth";
import {
  ddMmYyyyToIso,
  formatBirthDigitsInput,
  isoDateToLocalDate,
  isoToDdMmYyyy,
  localDateToIsoDate,
} from "@features/profile/birthDateDdMmYyyy";
import { AppAvatar } from "@ui/AppAvatar";
import { AppButton } from "@ui/AppButton";
import { AppInput } from "@ui/AppInput";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import {
  checkUsernameAvailable,
  fetchCurrentProfile,
  updateProfileRemote,
} from "@/services/profile/profileApi";
import { uploadAvatarFromLocalUri } from "@/services/profile/uploadAvatarFromUri";
import { useAuthStore } from "@/store/authStore";
import { colors, radius, spacing } from "@theme";

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export default function ProfileEditScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [birthDisplay, setBirthDisplay] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [initial, setInitial] = useState<{
    displayName: string;
    username: string;
    statusMessage: string;
    birthDisplay: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const u = await fetchCurrentProfile();
      const bd = u.birthDate ? isoToDdMmYyyy(u.birthDate) : "";
      setDisplayName(u.name);
      setUsername(u.username ?? "");
      setStatusMessage(u.statusMessage ?? "");
      setBirthDisplay(bd);
      setPhone(u.phone);
      setAvatarUri(u.avatarUri);
      setPendingAvatarUri(null);
      setInitial({
        displayName: u.name,
        username: u.username ?? "",
        statusMessage: u.statusMessage ?? "",
        birthDisplay: bd,
      });
      setUsernameAvailable(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được hồ sơ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const usernameFormatError = useMemo(() => {
    const t = username.trim();
    if (!t) return undefined;
    if (!USERNAME_RE.test(t)) return "3–30 ký tự: chữ thường, số, _";
    return undefined;
  }, [username]);

  useEffect(() => {
    const t = username.trim();
    if (!t || usernameFormatError) {
      setUsernameAvailable(null);
      return;
    }
    if (initial && t === initial.username.trim()) {
      setUsernameAvailable(true);
      return;
    }
    setUsernameAvailable(null);
    let cancelled = false;
    const id = setTimeout(() => {
      void (async () => {
        const ok = await checkUsernameAvailable(t);
        if (!cancelled) setUsernameAvailable(ok);
      })();
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [username, initial, usernameFormatError]);

  const usernameTakenError = useMemo(() => {
    const t = username.trim();
    if (!t || usernameFormatError) return undefined;
    if (initial && t === initial.username.trim()) return undefined;
    if (usernameAvailable === false) return "Username đã được dùng";
    return undefined;
  }, [username, usernameFormatError, initial, usernameAvailable]);

  const birthError = useMemo(() => {
    const t = birthDisplay.trim();
    if (!t) return undefined;
    const digits = t.replace(/\D/g, "");
    if (digits.length > 0 && digits.length < 8) return "Nhập ngày sinh hợp lệ";
    if (digits.length === 8 && !ddMmYyyyToIso(t)) return "Ngày không hợp lệ";
    return undefined;
  }, [birthDisplay]);

  const textDirty = useMemo(() => {
    if (!initial) return false;
    return (
      displayName.trim() !== initial.displayName ||
      username.trim() !== initial.username ||
      statusMessage.trim() !== initial.statusMessage ||
      birthDisplay.trim() !== initial.birthDisplay
    );
  }, [initial, displayName, username, statusMessage, birthDisplay]);

  const birthIsoForSave = useMemo(() => {
    const t = birthDisplay.trim();
    if (!t) return null;
    return ddMmYyyyToIso(t);
  }, [birthDisplay]);

  const usernameCheckPending = useMemo(() => {
    const t = username.trim();
    if (!t || usernameFormatError) return false;
    if (!initial) return false;
    if (t === initial.username.trim()) return false;
    return usernameAvailable === null;
  }, [username, usernameFormatError, initial, usernameAvailable]);

  const canSave =
    displayName.trim().length >= 1 &&
    !usernameFormatError &&
    !usernameTakenError &&
    !birthError &&
    !usernameCheckPending &&
    (birthDisplay.trim() === "" || birthIsoForSave !== null) &&
    (textDirty || pendingAvatarUri !== null) &&
    (username.trim() === "" ||
      usernameFormatError ||
      (initial && username.trim() === initial.username.trim()) ||
      usernameAvailable === true);

  const pickerDateValue = useMemo(() => {
    const iso = birthIsoForSave ?? "2000-01-01";
    return isoDateToLocalDate(iso);
  }, [birthIsoForSave]);

  const pickAvatar = async () => {
    setPickerBusy(true);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPickerBusy(false);
      Alert.alert("Ảnh", "Cần quyền truy cập thư viện ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    setPickerBusy(false);
    if (!result.canceled && result.assets[0]) {
      setPendingAvatarUri(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(undefined);
    try {
      let next = useAuthStore.getState().user;
      if (!next) throw new Error("Chưa đăng nhập");

      if (textDirty) {
        next = await updateProfileRemote({
          displayName: displayName.trim(),
          username: username.trim() === "" ? null : username.trim().toLowerCase(),
          statusMessage: statusMessage.trim() === "" ? null : statusMessage.trim(),
          birthDate: birthDisplay.trim() === "" ? null : birthIsoForSave,
        });
        setUser(next);
        const bd = next.birthDate ? isoToDdMmYyyy(next.birthDate) : "";
        setBirthDisplay(bd);
        setInitial({
          displayName: next.name,
          username: next.username ?? "",
          statusMessage: next.statusMessage ?? "",
          birthDisplay: bd,
        });
      }

      if (pendingAvatarUri) {
        if (USE_API_MOCK) {
          setUser({
            ...next,
            avatarUri: pendingAvatarUri,
          });
        } else {
          const after = await uploadAvatarFromLocalUri(pendingAvatarUri);
          setUser(after);
          next = after;
        }
        setAvatarUri(next.avatarUri);
        setPendingAvatarUri(null);
      }

      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không lưu được.";
      if (/username|Username|taken|Conflict/i.test(msg)) {
        setError("Username đã được dùng.");
        setUsernameAvailable(false);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "dismissed") return;
    }
    if (selected) {
      setBirthDisplay(isoToDdMmYyyy(localDateToIsoDate(selected)));
      setError(undefined);
    }
  };

  const avatarDisplay = pendingAvatarUri ?? avatarUri;

  return (
    <AppScreen
      scroll
      horizontalPadding="md"
      safeEdges={["top", "left", "right", "bottom"]}
      keyboardOffset={0}
    >
      <AuthHeader title="Hồ sơ" subtitle="Cập nhật thông tin hiển thị với bạn bè." />

      {loading ? (
        <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>
          Đang tải…
        </AppText>
      ) : null}

      <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
        <Pressable accessibilityRole="button" onPress={() => void pickAvatar()} disabled={pickerBusy || saving}>
          <AppAvatar uri={avatarDisplay} name={displayName || " "} size="lg" />
        </Pressable>
        <AppText
          variant="micro"
          color="primary"
          style={{ marginTop: spacing.xs }}
          onPress={() => void pickAvatar()}
        >
          {pickerBusy ? "Đang mở…" : "Đổi ảnh đại diện"}
        </AppText>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <AppText variant="micro" color="textSecondary" style={{ marginBottom: 6 }}>
          Số điện thoại
        </AppText>
        
        <AppText variant="subhead" style={{ fontWeight: "500", color: colors.textMuted }}>
          {phone || "—"}
        </AppText>
       
      </View>

      <AppInput
        label="Tên hiển thị"
        placeholder="Tên của bạn"
        value={displayName}
        onChangeText={(t) => {
          setDisplayName(t);
          setError(undefined);
        }}
        autoCapitalize="words"
        compact
      />

      <View style={{ height: spacing.sm }} />

      <AppInput
        label="Username"
        placeholder="vd: lan_anh"
        value={username}
        onChangeText={(t) => {
          setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ""));
          setError(undefined);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        compact
        error={usernameFormatError ?? usernameTakenError}
      />
      {username.trim() && !usernameFormatError && !usernameTakenError && usernameAvailable === true ? (
        <AppText variant="micro" color="primary" style={{ marginTop: 4 }}>
          Username có thể dùng
        </AppText>
      ) : null}

      <View style={{ height: spacing.sm }} />

      <AppInput
        label="Tiểu sử"
        placeholder="Giới thiệu ngắn"
        value={statusMessage}
        onChangeText={(t) => {
          setStatusMessage(t);
          setError(undefined);
        }}
        multiline
        compact
      />

      <View style={{ height: spacing.sm }} />

      <AppInput
        label="Sinh nhật"
        placeholder="20-08-1995"
        value={birthDisplay}
        onChangeText={(t) => {
          setBirthDisplay(formatBirthDigitsInput(t));
          setError(undefined);
        }}
        keyboardType="number-pad"
        autoCapitalize="none"
        compact
        error={birthError}
      />

      {Platform.OS !== "web" ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowDatePicker(true)}
            style={({ pressed }) => ({ marginTop: spacing.sm, opacity: pressed ? 0.75 : 1 })}
          >
            <AppText variant="micro" color="primary" style={{ fontWeight: "600" }}>
              Chọn trên lịch
            </AppText>
          </Pressable>
          {showDatePicker ? (
            <>
              <DateTimePicker
                value={pickerDateValue}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
              {Platform.OS === "ios" ? (
                <AppButton
                  title="Xong"
                  variant="secondary"
                  compact
                  size="sm"
                  onPress={() => setShowDatePicker(false)}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <AppText variant="micro" color="textMuted" style={{ marginTop: spacing.xs, lineHeight: 16 }}>
          Trên web: nhập dd-mm-yyyy (ví dụ 20-08-1995).
        </AppText>
      )}

      {error ? (
        <AppText variant="caption" color="danger" style={{ marginTop: spacing.sm }}>
          {error}
        </AppText>
      ) : null}

      <View style={{ flex: 1, minHeight: spacing.xl }} />

      <AppButton
        title="Lưu"
        variant="primary"
        compact
        loading={saving}
        disabled={!canSave || saving || loading}
        onPress={() => void onSave()}
      />
    </AppScreen>
  );
}
