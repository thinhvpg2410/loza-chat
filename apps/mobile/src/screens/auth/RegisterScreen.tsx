import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { registerSchema } from "@/constants/validation";
import { resetToMain } from "@/navigation/navigationRef";
import type { AuthStackParamList } from "@/navigation/types";
import { register } from "@/services/api/api";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/utils/errors";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FormValues = { name: string };

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen(_props: Props) {
  const phone = useAuthStore((s) => s.phone);
  const login = useAuthStore((s) => s.login);
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: yupResolver(registerSchema),
    mode: "onChange",
    defaultValues: { name: "" },
  });

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Quyền truy cập", "Vui lòng cấp quyền truy cập thư viện ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onSubmit = handleSubmit(async ({ name }) => {
    setApiError(null);
    setLoading(true);
    try {
      const res = await register({ phone, name, avatarUri });
      await login({ accessToken: res.accessToken, user: res.user });
      resetToMain();
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
          <Text className="mb-6 text-base text-slate-600 dark:text-slate-300">
            Hoàn tất hồ sơ để bắt đầu sử dụng ứng dụng.
          </Text>

          <View className="mb-8 items-center">
            <Pressable
              onPress={() => void pickAvatar()}
              className="relative h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-100 active:opacity-80 dark:bg-slate-800"
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  contentFit="cover"
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                <Ionicons name="camera-outline" size={40} color="#64748b" />
              )}
            </Pressable>
            <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ảnh đại diện (tuỳ chọn)</Text>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <Input
                ref={ref}
                label="Tên hiển thị"
                placeholder="Nhập tên của bạn"
                autoComplete="name"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.name?.message}
              />
            )}
          />

          {apiError ? <Text className="mt-4 text-center text-sm text-red-500">{apiError}</Text> : null}

          <View className="mt-6">
            <Button title="Hoàn tất" loading={loading} disabled={!isValid} onPress={onSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
