import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { phoneSchema } from "@/constants/validation";
import type { AuthStackParamList } from "@/navigation/types";
import { sendOtp } from "@/services/api/api";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/utils/errors";
import { yupResolver } from "@hookform/resolvers/yup";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FormValues = { phone: string };

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const setPhone = useAuthStore((s) => s.setPhone);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: yupResolver(phoneSchema),
    mode: "onChange",
    defaultValues: { phone: useAuthStore.getState().phone ?? "" },
  });

  const onSubmit = handleSubmit(async ({ phone }) => {
    setApiError(null);
    setLoading(true);
    try {
      await sendOtp(phone);
      setPhone(phone);
      navigation.navigate("OTP", { flow: "login" });
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
        <Text className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
          Chào mừng trở lại
        </Text>
        <Text className="mb-8 text-base text-slate-600 dark:text-slate-300">
          Nhập số điện thoại để tiếp tục
        </Text>

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <Input
              ref={ref}
              label="Số điện thoại"
              placeholder="0912345678"
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={10}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.phone?.message}
            />
          )}
        />

        {apiError ? <Text className="mb-4 text-center text-sm text-red-500">{apiError}</Text> : null}

        <View className="mt-4">
          <Button title="Tiếp tục" loading={loading} disabled={!isValid} onPress={onSubmit} />
        </View>

        <Pressable
          className="mt-6 items-center py-2 active:opacity-70"
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text className="text-base font-semibold text-primary">Quên mật khẩu?</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
