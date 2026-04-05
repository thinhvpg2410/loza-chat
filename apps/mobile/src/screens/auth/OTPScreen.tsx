import { Button } from "@/components/Button";
import { OTPInput } from "@/components/OTPInput";
import { otpSchema } from "@/constants/validation";
import { resetToMain } from "@/navigation/navigationRef";
import type { AuthFlow, AuthStackParamList } from "@/navigation/types";
import { sendOtp, verifyOtp } from "@/services/api/api";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/utils/errors";
import { useCountdown } from "@/hooks/useCountdown";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<AuthStackParamList, "OTP">;

function maskPhone(phone: string) {
  if (phone.length < 10) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

export function OTPScreen({ navigation, route }: Props) {
  const flow: AuthFlow = route.params.flow;
  const phone = useAuthStore((s) => s.phone);
  const setOtp = useAuthStore((s) => s.setOtp);
  const setResetToken = useAuthStore((s) => s.setResetToken);
  const login = useAuthStore((s) => s.login);

  const { secondsLeft, start, isRunning } = useCountdown(60);
  const [otp, setOtpLocal] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      start();
    }, [start]),
  );

  const syncOtp = useCallback(
    (code: string) => {
      setOtpLocal(code);
      setOtp(code);
      setFieldError(null);
      setApiError(null);
    },
    [setOtp],
  );

  const verify = useCallback(
    async (code: string) => {
      const parsed = await otpSchema.validate({ otp: code }).catch((e) => {
        setFieldError(e.message ?? "Mã OTP không hợp lệ");
        return null;
      });
      if (!parsed) return;

      setLoading(true);
      setApiError(null);
      try {
        const purpose = flow === "forgot" ? "forgot" : "login";
        const res = await verifyOtp({ phone, otp: code, purpose });

        if (flow === "forgot") {
          if (!res.resetToken) {
            setApiError("Không nhận được mã đặt lại mật khẩu");
            return;
          }
          setResetToken(res.resetToken);
          navigation.navigate("ResetPassword");
          return;
        }

        if (res.isNewUser) {
          navigation.navigate("Register");
          return;
        }

        if (res.accessToken && res.user) {
          await login({ accessToken: res.accessToken, user: res.user });
          resetToMain();
          return;
        }

        setApiError("Không thể xác thực. Vui lòng thử lại.");
      } catch (e) {
        setApiError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    },
    [flow, login, navigation, phone, setResetToken],
  );

  const onResend = async () => {
    if (isRunning || resendLoading) return;
    setResendLoading(true);
    setApiError(null);
    try {
      await sendOtp(phone);
      start();
    } catch (e) {
      setApiError(getErrorMessage(e));
    } finally {
      setResendLoading(false);
    }
  };

  const otpValid = /^\d{6}$/.test(otp);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["bottom"]}>
      <ScrollView contentContainerClassName="flex-grow px-5 pt-2 pb-6">
        <Text className="mb-2 text-base text-slate-600 dark:text-slate-300">
          Mã OTP đã gửi tới{" "}
          <Text className="font-semibold text-slate-900 dark:text-white">{maskPhone(phone)}</Text>
        </Text>
        <Text className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Nhập 6 chữ số để tiếp tục
        </Text>

        <OTPInput
          value={otp}
          onChange={syncOtp}
          onComplete={(code) => {
            void verify(code);
          }}
          disabled={loading}
          error={fieldError ?? undefined}
        />

        {apiError ? <Text className="mt-4 text-center text-sm text-red-500">{apiError}</Text> : null}

        <View className="mt-8">
          <Button
            title="Xác thực"
            loading={loading}
            disabled={!otpValid || loading}
            onPress={() => void verify(otp)}
          />
        </View>

        <View className="mt-6 flex-row items-center justify-center gap-2">
          <Text className="text-slate-600 dark:text-slate-300">
            {isRunning ? `Gửi lại sau ${secondsLeft}s` : "Không nhận được mã?"}
          </Text>
          {!isRunning ? (
            <Pressable onPress={() => void onResend()} disabled={resendLoading}>
              <Text className="font-semibold text-primary">
                {resendLoading ? "Đang gửi..." : "Gửi lại OTP"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
