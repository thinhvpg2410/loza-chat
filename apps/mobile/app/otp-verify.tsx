import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { AuthHeader, OTPInput } from "@components/auth";
import { useCountdown } from "@/hooks/useCountdown";
import { AppButton } from "@ui/AppButton";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { USE_API_MOCK } from "@/constants/env";
import {
  forgotPasswordRequestOtp,
  forgotPasswordVerifyOtp,
  getApiErrorMessage,
  registerRequestOtp,
  registerVerifyOtp,
} from "@/services/api/api";
import { useAuthStore } from "@/store/authStore";
import { spacing } from "@theme";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

type OtpMode = "register" | "forgot";

export default function OtpVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; mode?: string }>();
  const mode = (params.mode === "forgot" ? "forgot" : "register") as OtpMode;

  const setPhone = useAuthStore((s) => s.setPhone);
  const setOtp = useAuthStore((s) => s.setOtp);
  const setOtpProofToken = useAuthStore((s) => s.setOtpProofToken);
  const setResetToken = useAuthStore((s) => s.setResetToken);

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
    try {
      if (USE_API_MOCK) {
        await new Promise((r) => setTimeout(r, 900));
        if (fullCode !== "123456") {
          setError("Mã không đúng. Thử 123456 (mock).");
          return;
        }
        if (mode === "forgot") {
          setResetToken("mock-forgot-proof-token");
          router.push("/reset-password");
          return;
        }
        setOtp(fullCode);
        setOtpProofToken("mock-register-otp-proof-token");
        router.push("/profile-setup");
        return;
      }

      const phone = params.phone;
      if (!phone) {
        setError("Thiếu số điện thoại.");
        return;
      }

      if (mode === "forgot") {
        const { token } = await forgotPasswordVerifyOtp({ phoneNumber: phone, otp: fullCode });
        setResetToken(token);
        router.push("/reset-password");
        return;
      }

      const { token } = await registerVerifyOtp({ phoneNumber: phone, otp: fullCode });
      setOtp(fullCode);
      setOtpProofToken(token);
      router.push("/profile-setup");
    } catch (e) {
      setError(getApiErrorMessage(e, "Mã không đúng hoặc đã hết hạn."));
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (isRunning) return;
    const phone = params.phone;
    if (!phone) return;

    setCode("");
    setError(undefined);

    if (USE_API_MOCK) {
      start();
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "forgot") {
        await forgotPasswordRequestOtp(phone);
      } else {
        await registerRequestOtp(phone);
      }
      start();
    } catch (e) {
      setError(getApiErrorMessage(e, "Không gửi lại được mã."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen
      scroll
      footer={
        <AppButton
          title="Xác nhận"
          variant="primary"
          compact
          loading={submitting}
          disabled={code.length !== OTP_LENGTH || submitting}
          onPress={() => void verify(code)}
        />
      }
      horizontalPadding="md"
      safeEdges={["top", "left", "right", "bottom"]}
      keyboardOffset={0}
    >
      <AuthHeader
        title={mode === "forgot" ? "Xác nhận OTP" : "Nhập mã OTP"}
        subtitle={mode === "forgot" ? `Khôi phục mật khẩu — ${maskedPhone}` : `Đã gửi tới ${maskedPhone}`}
      />

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
        <AppText variant="micro" color="textSecondary" style={{ flexShrink: 1, minWidth: 0 }}>
          {isRunning ? `Gửi lại sau ${secondsLeft}s` : "Không nhận được mã?"}
        </AppText>
        <AppText
          variant="micro"
          color={isRunning ? "textMuted" : "primary"}
          onPress={() => void onResend()}
          style={{ fontWeight: "600", marginLeft: spacing.sm, flexShrink: 0 }}
        >
          Gửi lại
        </AppText>
      </View>

      {USE_API_MOCK ? (
        <AppText variant="micro" color="textMuted" style={{ marginTop: spacing.sm, lineHeight: 15 }}>
          Gợi ý mock: 123456
        </AppText>
      ) : null}
    </AppScreen>
  );
}
