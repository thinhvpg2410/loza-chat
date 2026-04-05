import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { resetPasswordSchema } from "@/constants/validation";
import type { AuthStackParamList } from "@/navigation/types";
import { resetPassword } from "@/services/api/api";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/utils/errors";
import { yupResolver } from "@hookform/resolvers/yup";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FormValues = { password: string; confirmPassword: string };

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export function ResetPasswordScreen({ navigation }: Props) {
  const resetToken = useAuthStore((s) => s.resetToken);
  const setResetToken = useAuthStore((s) => s.setResetToken);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: yupResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!resetToken) {
      setApiError("Phiên đặt lại mật khẩu không hợp lệ. Vui lòng thử lại.");
      return;
    }
    setApiError(null);
    setLoading(true);
    try {
      await resetPassword({ resetToken, password });
      setResetToken(null);
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (e) {
      setApiError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow px-5 pt-2 pb-6"
        >
          <Text className="mb-8 text-base text-slate-600 dark:text-slate-300">
            Tạo mật khẩu mới cho tài khoản của bạn.
          </Text>

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <Input
                ref={ref}
                label="Mật khẩu mới"
                placeholder="••••••"
                secureTextEntry
                autoComplete="password-new"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
                containerClassName="mb-4"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <Input
                ref={ref}
                label="Xác nhận mật khẩu"
                placeholder="••••••"
                secureTextEntry
                autoComplete="password-new"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          {apiError ? <Text className="mt-4 text-center text-sm text-red-500">{apiError}</Text> : null}

          <View className="mt-6">
            <Button title="Đặt lại mật khẩu" loading={loading} disabled={!isValid} onPress={onSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
