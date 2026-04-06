import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";

import { AuthHeader } from "@components/auth";
import { AppAvatar } from "@ui/AppAvatar";
import { AppButton } from "@ui/AppButton";
import { AppInput } from "@ui/AppInput";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import { createAccount, getApiErrorMessage } from "@/services/api/api";
import { uploadAvatarFromLocalUri } from "@/services/profile/uploadAvatarFromUri";
import { useAuthStore } from "@/store/authStore";
import { spacing } from "@theme";

const MIN_PASSWORD = 8;

export default function ProfileSetupScreen() {
  const router = useRouter();
  const otpProofToken = useAuthStore((s) => s.otpProofToken);
  const login = useAuthStore((s) => s.login);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarMime, setAvatarMime] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const canContinueMock = name.trim().length >= 2;

  const passwordError = useMemo(() => {
    if (USE_API_MOCK) return undefined;
    if (!password) return undefined;
    if (password.length < MIN_PASSWORD) return `Tối thiểu ${MIN_PASSWORD} ký tự`;
    return undefined;
  }, [password]);

  const canContinueReal =
    name.trim().length >= 2 &&
    password.length >= MIN_PASSWORD &&
    password === passwordConfirm &&
    Boolean(otpProofToken);

  const pickAvatar = async () => {
    setBusy(true);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setBusy(false);
      Alert.alert("Ảnh", "Cần quyền truy cập thư viện ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    setBusy(false);
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setAvatarUri(a.uri);
      setAvatarMime(a.mimeType ?? "image/jpeg");
    }
  };

  const onContinue = async () => {
    setFormError(undefined);

    if (USE_API_MOCK) {
      if (!canContinueMock) return;
      router.push({
        pathname: "/permissions",
        params: {
          displayName: encodeURIComponent(name.trim()),
          avatarUri: avatarUri ? encodeURIComponent(avatarUri) : "",
        },
      });
      return;
    }

    if (!canContinueReal || !otpProofToken) {
      setFormError(!otpProofToken ? "Phiên đăng ký hết hạn. Thử lại từ đầu." : "Kiểm tra thông tin.");
      return;
    }

    setSubmitting(true);
    try {
      const session = await createAccount({
        token: otpProofToken,
        password,
        displayName: name.trim(),
      });
      await login({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
      });

      if (avatarUri) {
        try {
          const updated = await uploadAvatarFromLocalUri(avatarUri, avatarMime);
          setUser(updated);
        } catch {
          // Avatar is optional; user can change later in settings.
        }
      }

      router.push({
        pathname: "/permissions",
        params: {
          displayName: encodeURIComponent(name.trim()),
          avatarUri: "",
        },
      });
    } catch (e) {
      setFormError(getApiErrorMessage(e, "Không tạo được tài khoản."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen
      scroll
      horizontalPadding="md"
      safeEdges={["top", "left", "right", "bottom"]}
      keyboardOffset={0}
    >
      <AuthHeader
        title="Hồ sơ"
        subtitle={
          USE_API_MOCK
            ? "Tên và ảnh có thể đổi sau trong Cài đặt."
            : "Đặt mật khẩu và tên hiển thị. Ảnh đại diện tải lên máy chủ nếu bạn chọn."
        }
      />

      <View style={{ alignItems: "center", marginBottom: spacing.md }}>
        <Pressable accessibilityRole="button" onPress={() => void pickAvatar()} disabled={busy || submitting}>
          <AppAvatar uri={avatarUri ?? undefined} name={name || " "} size="md" />
        </Pressable>
        <AppText
          variant="micro"
          color="primary"
          style={{ marginTop: spacing.xs }}
          onPress={() => void pickAvatar()}
        >
          {busy ? "Đang mở…" : "Chọn ảnh"}
        </AppText>
      </View>

      {!USE_API_MOCK ? (
        <>
          <AppInput
            label="Mật khẩu"
            placeholder={`Tối thiểu ${MIN_PASSWORD} ký tự`}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setFormError(undefined);
            }}
            secureTextEntry
            autoCapitalize="none"
            compact
            error={passwordError && password.length > 0 ? passwordError : undefined}
          />
          <View style={{ height: spacing.sm }} />
          <AppInput
            label="Nhập lại mật khẩu"
            placeholder="Khớp với mật khẩu trên"
            value={passwordConfirm}
            onChangeText={(t) => {
              setPasswordConfirm(t);
              setFormError(undefined);
            }}
            secureTextEntry
            autoCapitalize="none"
            compact
            error={
              passwordConfirm.length > 0 && password !== passwordConfirm
                ? "Mật khẩu chưa khớp"
                : undefined
            }
          />
          <View style={{ height: spacing.md }} />
        </>
      ) : null}

      <AppInput
        label="Tên hiển thị"
        placeholder="Ví dụ: Lan Anh"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setFormError(undefined);
        }}
        autoCapitalize="words"
        autoCorrect
        compact
      />

      {formError ? (
        <AppText variant="caption" color="danger" style={{ marginTop: spacing.sm }}>
          {formError}
        </AppText>
      ) : null}

      <View style={{ flex: 1, minHeight: spacing.xxl }} />

      <AppButton
        title="Tiếp tục"
        variant="primary"
        compact
        loading={submitting}
        disabled={USE_API_MOCK ? !canContinueMock : !canContinueReal || submitting}
        onPress={() => void onContinue()}
      />
    </AppScreen>
  );
}
