import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { isAxiosError } from "axios";

import { AuthHeader, PhoneCountryRow, type CountryOption } from "@components/auth";
import { AppButton } from "@ui/AppButton";
import { AppInput } from "@ui/AppInput";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import { buildE164, isValidVnLength } from "@lib/auth-mock";
import { getApiErrorMessage, registerRequestOtp } from "@/services/api/api";
import { colors, radius, spacing } from "@theme";

const DEFAULT_COUNTRY: CountryOption = {
  dial: "+84",
  label: "Việt Nam",
  flag: "🇻🇳",
};

export default function PhoneLoginScreen() {
  const router = useRouter();
  const [country, setCountry] = useState<CountryOption>(DEFAULT_COUNTRY);
  const [national, setNational] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const e164 = useMemo(() => buildE164(country.dial, national), [country.dial, national]);
  const canContinue = isValidVnLength(national);

  const onContinue = async () => {
    if (!canContinue) return;
    setError(undefined);

    if (USE_API_MOCK) {
      router.push({
        pathname: "/otp-verify",
        params: { phone: e164, mode: "register" },
      });
      return;
    }

    setSubmitting(true);
    try {
      await registerRequestOtp(e164);
      router.push({
        pathname: "/otp-verify",
        params: { phone: e164, mode: "register" },
      });
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 409) {
        router.push({
          pathname: "/login-password",
          params: { phone: e164 },
        });
        return;
      }
      setError(getApiErrorMessage(e, "Không gửi được mã. Thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen
      scroll
      footer={
        <>
          <AppButton
            title="Tiếp tục"
            variant="primary"
            compact
            loading={submitting}
            disabled={!canContinue || submitting}
            onPress={() => void onContinue()}
          />

          <AppText
            variant="micro"
            color="primary"
            style={{ textAlign: "center", marginTop: spacing.sm }}
            onPress={() => router.push({ pathname: "/forgot-password" })}
          >
            Quên mật khẩu?
          </AppText>

          <AppText
            variant="micro"
            color="textMuted"
            style={{ textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.xs, lineHeight: 15 }}
          >
            {USE_API_MOCK ? "Tiếp tục là đồng ý điều khoản (mock)." : "Tiếp tục là đồng ý điều khoản dịch vụ."}
          </AppText>
        </>
      }
      horizontalPadding="md"
      safeEdges={["top", "left", "right", "bottom"]}
      keyboardOffset={0}
    >
      <AuthHeader showBack={false} title="Đăng nhập" subtitle="Nhập số điện thoại để nhận mã OTP." />

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing.md,
        }}
      >
        <AppText variant="micro" color="textSecondary" style={{ marginBottom: 6 }}>
          Mã vùng
        </AppText>
        <PhoneCountryRow value={country} onChange={setCountry} />

        <View style={{ height: spacing.md }} />

        <AppInput
          label="Số điện thoại"
          placeholder="9xx xxx xxx"
          keyboardType="phone-pad"
          value={national}
          onChangeText={(t) => {
            setNational(t);
            setError(undefined);
          }}
          autoComplete="tel"
          compact
          error={error}
        />
      </View>

      <AppText variant="micro" color="textMuted" style={{ marginTop: spacing.sm, lineHeight: 16 }}>
        SMS xác nhận có thể tính phí nhà mạng.
      </AppText>
    </AppScreen>
  );
}
