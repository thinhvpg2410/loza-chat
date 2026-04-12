import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";

import { AuthHeader } from "@components/auth";
import { AppButton } from "@ui/AppButton";
import { AppInput } from "@ui/AppInput";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import { changePasswordRemote } from "@/services/profile/profileApi";
import { useAuthStore } from "@/store/authStore";
import { colors, spacing } from "@theme";

const MOCK_MIN_NEW_LEN = 8;

/** Mirrors API `IsStrongPassword` for client-side hints (real API). */
function strongPasswordError(pw: string): string | undefined {
  if (!pw) return undefined;
  if (pw.length < 8 || pw.length > 128) return "8–128 ký tự";
  if (!/[a-z]/.test(pw)) return "Cần chữ thường (a–z)";
  if (!/[A-Z]/.test(pw)) return "Cần chữ hoa (A–Z)";
  if (!/[0-9]/.test(pw)) return "Cần có số";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Cần ký tự đặc biệt";
  return undefined;
}

function newPasswordFieldError(pw: string): string | undefined {
  if (!pw) return undefined;
  if (USE_API_MOCK) {
    return pw.length < MOCK_MIN_NEW_LEN ? `Tối thiểu ${MOCK_MIN_NEW_LEN} ký tự` : undefined;
  }
  return strongPasswordError(pw);
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsVisible, setPasswordsVisible] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const newPwError = useMemo(() => newPasswordFieldError(newPassword), [newPassword]);
  const confirmError = useMemo(() => {
    if (!confirmPassword) return undefined;
    return confirmPassword !== newPassword ? "Mật khẩu mới chưa khớp" : undefined;
  }, [confirmPassword, newPassword]);

  const sameAsCurrentError = useMemo(() => {
    if (!newPassword || !currentPassword) return undefined;
    return newPassword === currentPassword ? "Mật khẩu mới phải khác mật khẩu hiện tại" : undefined;
  }, [newPassword, currentPassword]);

  const canSubmit =
    currentPassword.length >= 1 &&
    !newPwError &&
    !sameAsCurrentError &&
    newPassword.length >= 1 &&
    confirmPassword === newPassword;

  const visibilityToggle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={passwordsVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      hitSlop={10}
      onPress={() => setPasswordsVisible((v) => !v)}
      style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
    >
      <Ionicons
        name={passwordsVisible ? "eye-off-outline" : "eye-outline"}
        size={22}
        color={colors.textMuted}
      />
    </Pressable>
  );

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(undefined);
    setSubmitting(true);
    try {
      await changePasswordRemote({
        currentPassword,
        newPassword,
      });
      await logout();
      Alert.alert(
        "Đã cập nhật",
        "Mật khẩu đã đổi. Tất cả phiên đăng nhập khác đã kết thúc. Vui lòng đăng nhập lại.",
        [{ text: "OK", onPress: () => router.replace("/phone-login") }],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đổi được mật khẩu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen
      scroll
      footer={
        <AppButton
          title="Đổi mật khẩu"
          variant="primary"
          compact
          loading={submitting}
          disabled={!canSubmit || submitting}
          onPress={() => void onSubmit()}
        />
      }
      horizontalPadding="md"
      safeEdges={["top", "left", "right", "bottom"]}
      keyboardOffset={0}
    >
      <AuthHeader
        title="Đổi mật khẩu"
        subtitle="Nhập mật khẩu hiện tại. Sau khi lưu, bạn cần đăng nhập lại trên thiết bị này."
      />

      <AppInput
        label="Mật khẩu hiện tại"
        placeholder="••••••••"
        value={currentPassword}
        onChangeText={(t) => {
          setCurrentPassword(t);
          setError(undefined);
        }}
        secureTextEntry={!passwordsVisible}
        autoCapitalize="none"
        compact
        endAdornment={visibilityToggle}
      />

      <View style={{ height: spacing.sm }} />

      <AppInput
        label="Mật khẩu mới"
        placeholder={USE_API_MOCK ? `Tối thiểu ${MOCK_MIN_NEW_LEN} ký tự` : "8+ ký tự, hoa, thường, số, ký tự đặc biệt"}
        value={newPassword}
        onChangeText={(t) => {
          setNewPassword(t);
          setError(undefined);
        }}
        secureTextEntry={!passwordsVisible}
        autoCapitalize="none"
        compact
        error={newPwError ?? sameAsCurrentError}
        endAdornment={visibilityToggle}
      />

      <View style={{ height: spacing.sm }} />

      <AppInput
        label="Nhập lại mật khẩu mới"
        placeholder="Khớp với mật khẩu mới"
        value={confirmPassword}
        onChangeText={(t) => {
          setConfirmPassword(t);
          setError(undefined);
        }}
        secureTextEntry={!passwordsVisible}
        autoCapitalize="none"
        compact
        error={confirmError}
        endAdornment={visibilityToggle}
      />

      {!USE_API_MOCK ? (
        <AppText variant="micro" color="textMuted" style={{ marginTop: spacing.sm, lineHeight: 16 }}>
          Mật khẩu mới phải có chữ hoa, chữ thường, số và ký tự đặc biệt (theo yêu cầu máy chủ).
        </AppText>
      ) : null}

      {error ? (
        <AppText variant="caption" color="danger" style={{ marginTop: spacing.sm }}>
          {error}
        </AppText>
      ) : null}
    </AppScreen>
  );
}
