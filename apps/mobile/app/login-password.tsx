import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { AuthHeader } from "@components/auth";
import { AppButton } from "@ui/AppButton";
import { AppInput } from "@ui/AppInput";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { getApiErrorMessage, loginWithDevice } from "@/services/api/api";
import { useAuthStore } from "@/store/authStore";
import { spacing } from "@theme";

const MIN_PASSWORD = 8;

export default function LoginPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; identifier?: string }>();
  const storeLogin = useAuthStore((s) => s.login);
  const setDeviceLoginChallenge = useAuthStore((s) => s.setDeviceLoginChallenge);

  const identifier = (params.identifier ?? params.phone ?? "").trim();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = identifier.length >= 3 && password.length >= MIN_PASSWORD;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(undefined);
    setSubmitting(true);
    try {
      const outcome = await loginWithDevice({ identifier, password });
      if (outcome.kind === "device_challenge") {
        setDeviceLoginChallenge({
          deviceVerificationToken: outcome.deviceVerificationToken,
          otpChannel: outcome.otpChannel,
          identifier,
          password,
        });
        router.push({ pathname: "/otp-verify", params: { mode: "login-device" } });
        return;
      }
      await storeLogin({
        accessToken: outcome.session.accessToken,
        refreshToken: outcome.session.refreshToken,
        user: outcome.session.user,
      });
      router.replace("/main");
    } catch (e) {
      setError(getApiErrorMessage(e, "Sai số điện thoại/email hoặc mật khẩu."));
    } finally {
      setSubmitting(false);
    }
  };

  const isEmail = identifier.includes("@");

  return (
    <AppScreen
      scroll
      footer={
        <>
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
            {isEmail ? "Đổi email" : "Đổi số điện thoại"}
          </AppText>
        </>
      }
      horizontalPadding="md"
      safeEdges={["top", "left", "right", "bottom"]}
      keyboardOffset={0}
    >
      <AuthHeader title="Mật khẩu" subtitle={`Đăng nhập với ${identifier}`} />

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
            params: isEmail ? { email: identifier } : { phone: identifier },
          })
        }
      >
        Quên mật khẩu?
      </AppText>
    </AppScreen>
  );
}
