import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AuthHeader, PhoneCountryRow, type CountryOption } from "@components/auth";
import { AppButton } from "@ui/AppButton";
import { AppInput } from "@ui/AppInput";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { useAuthStore } from "@/store/authStore";
import { buildE164, isValidVnLength } from "@lib/auth-mock";
import { colors, radius, spacing } from "@theme";

const DEFAULT_COUNTRY: CountryOption = {
  dial: "+84",
  label: "Việt Nam",
  flag: "🇻🇳",
};

export default function PhoneLoginScreen() {
  const router = useRouter();
  const setPhone = useAuthStore((s) => s.setPhone);
  const [country, setCountry] = useState<CountryOption>(DEFAULT_COUNTRY);
  const [national, setNational] = useState("");

  const e164 = useMemo(() => buildE164(country.dial, national), [country.dial, national]);
  const canContinue = isValidVnLength(national);

  const onContinue = () => {
    if (!canContinue) return;
    setPhone(e164);
    router.push({
      pathname: "/otp-verify",
      params: { phone: e164 },
    });
  };

  return (
    <AppScreen
      scroll
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
          onChangeText={setNational}
          autoComplete="tel"
          compact
        />
      </View>

      <AppText variant="micro" color="textMuted" style={{ marginTop: spacing.sm, lineHeight: 16 }}>
        SMS xác nhận có thể tính phí nhà mạng.
      </AppText>

      <View style={{ flex: 1, minHeight: spacing.xxl }} />

      <AppButton title="Tiếp tục" variant="primary" compact disabled={!canContinue} onPress={onContinue} />

      <AppText
        variant="micro"
        color="textMuted"
        style={{ textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.xs, lineHeight: 15 }}
      >
        Tiếp tục là đồng ý điều khoản (mock).
      </AppText>
    </AppScreen>
  );
}
