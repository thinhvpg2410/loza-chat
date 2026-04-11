import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  loginWithDevice,
  registerRequestOtp,
  registerVerifyOtp,
  verifyLoginDeviceOtp,
} from "@/services/api/api";
import { useAuthStore } from "@/store/authStore";
import { spacing } from "@theme";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

type OtpMode = "register" | "forgot" | "login-device";

function maskPhoneE164(phone: string): string {
  const t = phone.trim();
  if (!t.startsWith("+")) return "••••••••";
  return t.replace(/(\+\d{2})(\d+)(\d{2})$/, "$1••••$3");
}

function maskEmail(email: string): string {
  const t = email.trim();
  const at = t.indexOf("@");
  if (at <= 0) return t;
  const local = t.slice(0, at);
  const domain = t.slice(at + 1);
  const l = local.length <= 2 ? `${local[0] ?? "?"}*` : `${local.slice(0, 2)}***`;
  return `${l}@${domain}`;
}

export default function OtpVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; email?: string; mode?: string }>();

  const mode: OtpMode = useMemo(() => {
    if (params.mode === "forgot") return "forgot";
    if (params.mode === "login-device") return "login-device";
    return "register";
  }, [params.mode]);

  const setPhone = useAuthStore((s) => s.setPhone);
  const setOtp = useAuthStore((s) => s.setOtp);
  const setOtpProofToken = useAuthStore((s) => s.setOtpProofToken);
  const setResetToken = useAuthStore((s) => s.setResetToken);
  const storeLogin = useAuthStore((s) => s.login);
  const setDeviceLoginChallenge = useAuthStore((s) => s.setDeviceLoginChallenge);
  const deviceLoginChallenge = useAuthStore((s) => s.deviceLoginChallenge);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const { secondsLeft, start, isRunning } = useCountdown(RESEND_SECONDS);

  const phone = typeof params.phone === "string" ? params.phone : "";
  const email = typeof params.email === "string" ? params.email : "";

  const maskedDestination = useMemo(() => {
    if (mode === "login-device" && deviceLoginChallenge) {
      const id = deviceLoginChallenge.identifier;
      if (deviceLoginChallenge.otpChannel === "email" || id.includes("@")) {
        return maskEmail(id);
      }
      return maskPhoneE164(id);
    }
    if (mode === "forgot") {
      if (email) return maskEmail(email);
      return maskPhoneE164(phone);
    }
    return maskPhoneE164(phone);
  }, [mode, deviceLoginChallenge, email, phone]);

  useEffect(() => {
    if (params.phone) {
      setPhone(params.phone);
    }
  }, [params.phone, setPhone]);

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (USE_API_MOCK || mode !== "login-device") return;
    const c = useAuthStore.getState().deviceLoginChallenge;
    if (!c?.deviceVerificationToken) {
      router.replace("/phone-login");
    }
  }, [mode, router]);

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
        if (mode === "login-device") {
          const token =
            useAuthStore.getState().deviceLoginChallenge?.deviceVerificationToken ?? "mock";
          const session = await verifyLoginDeviceOtp({
            deviceVerificationToken: token,
            otp: fullCode,
          });
          await storeLogin({
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            user: session.user,
          });
          router.replace("/main");
          return;
        }
        setOtp(fullCode);
        setOtpProofToken("mock-register-otp-proof-token");
        router.push("/profile-setup");
        return;
      }

      if (mode === "login-device") {
        const c = useAuthStore.getState().deviceLoginChallenge;
        if (!c?.deviceVerificationToken) {
          setError("Phiên hết hạn. Đăng nhập lại.");
          return;
        }
        const session = await verifyLoginDeviceOtp({
          deviceVerificationToken: c.deviceVerificationToken,
          otp: fullCode,
        });
        await storeLogin({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
        });
        router.replace("/main");
        return;
      }

      if (mode === "forgot") {
        if (email) {
          const { token } = await forgotPasswordVerifyOtp({ email, otp: fullCode });
          setResetToken(token);
        } else {
          if (!phone) {
            setError("Thiếu số điện thoại.");
            return;
          }
          const { token } = await forgotPasswordVerifyOtp({ phoneNumber: phone, otp: fullCode });
          setResetToken(token);
        }
        router.push("/reset-password");
        return;
      }

      if (!phone) {
        setError("Thiếu số điện thoại.");
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
    setCode("");
    setError(undefined);

    if (USE_API_MOCK) {
      start();
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login-device") {
        const c = useAuthStore.getState().deviceLoginChallenge;
        if (!c) {
          setError("Phiên hết hạn. Đăng nhập lại.");
          return;
        }
        const outcome = await loginWithDevice({
          identifier: c.identifier,
          password: c.password,
        });
        if (outcome.kind === "session") {
          await storeLogin({
            accessToken: outcome.session.accessToken,
            refreshToken: outcome.session.refreshToken,
            user: outcome.session.user,
          });
          router.replace("/main");
          return;
        }
        setDeviceLoginChallenge({
          ...c,
          deviceVerificationToken: outcome.deviceVerificationToken,
          otpChannel: outcome.otpChannel,
        });
        start();
        return;
      }

      if (mode === "forgot") {
        if (email) {
          await forgotPasswordRequestOtp({ email });
        } else {
          if (!phone) return;
          await forgotPasswordRequestOtp({ phoneNumber: phone });
        }
        start();
        return;
      }

      if (!phone) return;
      await registerRequestOtp(phone);
      start();
    } catch (e) {
      setError(getApiErrorMessage(e, "Không gửi lại được mã."));
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle =
    mode === "login-device"
      ? "Xác thực thiết bị"
      : mode === "forgot"
        ? "Xác nhận OTP"
        : "Nhập mã OTP";

  const headerSubtitle =
    mode === "login-device"
      ? `Mã đã gửi tới ${maskedDestination}`
      : mode === "forgot"
        ? `Khôi phục mật khẩu — ${maskedDestination}`
        : `Đã gửi tới ${maskedDestination}`;

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
      <AuthHeader title={headerTitle} subtitle={headerSubtitle} />

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
