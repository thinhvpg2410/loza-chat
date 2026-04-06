import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { isAxiosError } from "axios";

import { AuthHeader, PhoneCountryRow, type CountryOption } from "@components/auth";
import { AppButton } from "@ui/AppButton";
import { AppInput } from "@ui/AppInput";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import { buildE164, isValidVnLength } from "@lib/auth-mock";
import { isLoginEmailFormat } from "@lib/loginIdentifier";
import { forgotPasswordRequestOtp, getApiErrorMessage } from "@/services/api/api";
import { colors, radius, spacing } from "@theme";

const DEFAULT_COUNTRY: CountryOption = {
  dial: "+84",
  label: "Việt Nam",
  flag: "🇻🇳",
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ phone?: string; email?: string }>();
  const [country, setCountry] = useState<CountryOption>(DEFAULT_COUNTRY);
  const [national, setNational] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const emailFromRoute = Array.isArray(routeParams.email) ? routeParams.email[0] : routeParams.email;
  const useEmail = typeof emailFromRoute === "string" && emailFromRoute.trim().length > 0;

  const e164 = useMemo(() => buildE164(country.dial, national), [country.dial, national]);
  const canContinuePhone = isValidVnLength(national);
  const canContinueEmail = isLoginEmailFormat(email);
  const canContinue = useEmail ? canContinueEmail : canContinuePhone;

  useEffect(() => {
    const p = routeParams.phone;
    const phoneStr = Array.isArray(p) ? p[0] : p;
    if (phoneStr && phoneStr.startsWith("+84")) {
      setNational(phoneStr.slice(4));
    }
    const e = Array.isArray(routeParams.email) ? routeParams.email[0] : routeParams.email;
    if (typeof e === "string" && e.trim()) {
      setEmail(e.trim());
    }
  }, [routeParams.phone, routeParams.email]);

  const onContinue = async () => {
    if (!canContinue) return;
    setError(undefined);

    if (USE_API_MOCK) {
      router.push({
        pathname: "/otp-verify",
        params: useEmail
          ? { email: email.trim().toLowerCase(), mode: "forgot" }
          : { phone: e164, mode: "forgot" },
      });
      return;
    }

    setSubmitting(true);
    try {
      if (useEmail) {
        await forgotPasswordRequestOtp({ email: email.trim().toLowerCase() });
        router.push({
          pathname: "/otp-verify",
          params: { email: email.trim().toLowerCase(), mode: "forgot" },
        });
      } else {
        await forgotPasswordRequestOtp({ phoneNumber: e164 });
        router.push({
          pathname: "/otp-verify",
          params: { phone: e164, mode: "forgot" },
        });
      }
    } catch (e) {
      setError(
        isAxiosError(e) ? getApiErrorMessage(e, "Không gửi được mã.") : getApiErrorMessage(e),
      );
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
            title="Gửi mã"
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
            onPress={() => router.back()}
          >
            Quay lại đăng nhập
          </AppText>
        </>
      }
      horizontalPadding="md"
      safeEdges={["top", "left", "right", "bottom"]}
      keyboardOffset={0}
    >
      <AuthHeader
        title="Quên mật khẩu"
        subtitle={
          useEmail
            ? "Nhập email để nhận mã xác nhận."
            : "Nhập số điện thoại để nhận mã xác nhận."
        }
      />

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing.md,
        }}
      >
        {useEmail ? (
          <AppInput
            label="Email"
            placeholder="ten@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(undefined);
            }}
            compact
            error={error}
          />
        ) : (
          <>
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
          </>
        )}
      </View>
    </AppScreen>
  );
}
