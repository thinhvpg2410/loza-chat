import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { AuthHeader, OTPInput } from "@components/auth";
import { useCountdown } from "@/hooks/useCountdown";
import { AppButton } from "@ui/AppButton";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { useAuthStore } from "@/store/authStore";
import { spacing } from "@theme";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function OtpVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const setPhone = useAuthStore((s) => s.setPhone);
  const setOtp = useAuthStore((s) => s.setOtp);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const { secondsLeft, start, isRunning } = useCountdown(RESEND_SECONDS);

  useEffect(() => {
    if (params.phone) {
      setPhone(params.phone);
    }
  }, [params.phone, setPhone]);

  useEffect(() => {
    start();
  }, [start]);

  const maskedPhone = params.phone
    ? params.phone.replace(/(\+\d{2})(\d+)(\d{2})$/, "$1••••$3")
    : "••••••••";

  const verify = async (fullCode: string) => {
    setSubmitting(true);
    setError(undefined);
    await new Promise((r) => setTimeout(r, 900));
    if (fullCode !== "123456") {
      setError("Mã không đúng. Thử 123456 (mock).");
      setSubmitting(false);
      return;
    }
    setOtp(fullCode);
    setSubmitting(false);
    router.push("/profile-setup");
  };

  const onResend = () => {
    if (isRunning) return;
    setCode("");
    setError(undefined);
    start();
  };

  return (
    <AppScreen
      scroll
      horizontalPadding="md"
      safeEdges={["top", "left", "right", "bottom"]}
      keyboardOffset={0}
    >
      <AuthHeader title="Nhập mã OTP" subtitle={`Đã gửi tới ${maskedPhone}`} />

      <View style={{ marginTop: spacing.sm }}>
        <OTPInput
          compact
          value={code}
          onChange={(next) => {
            setCode(next);
            setError(undefined);
          }}
          onComplete={(full) => {
            void verify(full);
          }}
          disabled={submitting}
          error={error}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: spacing.md,
          paddingHorizontal: 2,
        }}
      >
        <AppText variant="micro" color="textSecondary">
          {isRunning ? `Gửi lại sau ${secondsLeft}s` : "Không nhận được mã?"}
        </AppText>
        <AppText
          variant="micro"
          color={isRunning ? "textMuted" : "primary"}
          onPress={onResend}
          style={{ fontWeight: "600" }}
        >
          Gửi lại
        </AppText>
      </View>

      <AppText variant="micro" color="textMuted" style={{ marginTop: spacing.sm, lineHeight: 15 }}>
        Gợi ý mock: 123456
      </AppText>

      <View style={{ flex: 1, minHeight: spacing.xxl }} />

      <AppButton
        title="Xác nhận"
        variant="primary"
        compact
        loading={submitting}
        disabled={code.length !== OTP_LENGTH || submitting}
        onPress={() => void verify(code)}
      />
    </AppScreen>
  );
}
