import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AuthHeader } from "@components/auth";
import { AppButton } from "@ui/AppButton";
import { AppInput } from "@ui/AppInput";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { getApiErrorMessage, login as loginRequest } from "@/services/api/api";
import { useAuthStore } from "@/store/authStore";
import { spacing } from "@theme";

const MIN_PASSWORD = 8;

export default function LoginPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const storeLogin = useAuthStore((s) => s.login);

  const phone = params.phone ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = phone.length >= 8 && password.length >= MIN_PASSWORD;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(undefined);
    setSubmitting(true);
    try {
      const session = await loginRequest({ identifier: phone, password });
      await storeLogin({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
      });
      router.replace("/main");
    } catch (e) {
      setError(getApiErrorMessage(e, "Sai số điện thoại hoặc mật khẩu."));
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
      <AuthHeader title="Mật khẩu" subtitle={`Đăng nhập với ${phone}`} />

      <AppInput
        label="Mật khẩu"
        placeholder={`Tối thiểu ${MIN_PASSWORD} ký tự`}
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setError(undefined);
        }}
        secureTextEntry
        autoCapitalize="none"
        compact
        error={error}
      />

      <AppText
        variant="micro"
        color="primary"
        style={{ marginTop: spacing.md }}
        onPress={() =>
          router.push({
            pathname: "/forgot-password",
            params: { phone },
          })
        }
      >
        Quên mật khẩu?
      </AppText>

      <View style={{ flex: 1, minHeight: spacing.xxl }} />

      <AppButton
        title="Đăng nhập"
        variant="primary"
        compact
        loading={submitting}
        disabled={!canSubmit || submitting}
        onPress={() => void onSubmit()}
      />

      <AppText
        variant="micro"
        color="primary"
        style={{ textAlign: "center", marginTop: spacing.sm }}
        onPress={() => router.replace("/phone-login")}
      >
        Đổi số điện thoại
      </AppText>
    </AppScreen>
  );
}
