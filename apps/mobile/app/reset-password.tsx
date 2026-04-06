import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AuthHeader } from "@components/auth";
import { AppButton } from "@ui/AppButton";
import { AppInput } from "@ui/AppInput";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { forgotPasswordReset, getApiErrorMessage } from "@/services/api/api";
import { useAuthStore } from "@/store/authStore";
import { spacing } from "@theme";

const MIN_PASSWORD = 8;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const resetToken = useAuthStore((s) => s.resetToken);
  const setResetToken = useAuthStore((s) => s.setResetToken);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    Boolean(resetToken) &&
    password.length >= MIN_PASSWORD &&
    password === passwordConfirm;

  const onSubmit = async () => {
    if (!canSubmit || !resetToken) return;
    setError(undefined);
    setSubmitting(true);
    try {
      await forgotPasswordReset({ token: resetToken, newPassword: password });
      setResetToken(null);
      router.replace("/phone-login");
    } catch (e) {
      setError(getApiErrorMessage(e, "Không đặt lại được mật khẩu."));
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
      <AuthHeader title="Mật khẩu mới" subtitle="Nhập mật khẩu mới cho tài khoản." />

      {!resetToken ? (
        <AppText variant="caption" color="danger" style={{ marginBottom: spacing.sm }}>
          Phiên hết hạn. Thử quên mật khẩu từ đầu.
        </AppText>
      ) : null}

      <AppInput
        label="Mật khẩu mới"
        placeholder={`Tối thiểu ${MIN_PASSWORD} ký tự`}
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setError(undefined);
        }}
        secureTextEntry
        autoCapitalize="none"
        compact
      />

      <View style={{ height: spacing.sm }} />

      <AppInput
        label="Nhập lại mật khẩu"
        value={passwordConfirm}
        onChangeText={(t) => {
          setPasswordConfirm(t);
          setError(undefined);
        }}
        secureTextEntry
        autoCapitalize="none"
        compact
        error={
          passwordConfirm.length > 0 && password !== passwordConfirm ? "Mật khẩu chưa khớp" : undefined
        }
      />

      {error ? (
        <AppText variant="caption" color="danger" style={{ marginTop: spacing.sm }}>
          {error}
        </AppText>
      ) : null}

      <View style={{ flex: 1, minHeight: spacing.xxl }} />

      <AppButton
        title="Cập nhật mật khẩu"
        variant="primary"
        compact
        loading={submitting}
        disabled={!canSubmit || submitting}
        onPress={() => void onSubmit()}
      />
    </AppScreen>
  );
}
