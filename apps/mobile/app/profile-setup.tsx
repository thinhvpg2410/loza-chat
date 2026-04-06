import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";

import { AuthHeader } from "@components/auth";
import { AppAvatar } from "@ui/AppAvatar";
import { AppButton } from "@ui/AppButton";
import { AppInput } from "@ui/AppInput";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { spacing } from "@theme";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canContinue = name.trim().length >= 2;

  const pickAvatar = async () => {
    setBusy(true);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setBusy(false);
      Alert.alert("Ảnh", "Cần quyền truy cập ảnh (mock).");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    setBusy(false);
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onContinue = () => {
    if (!canContinue) return;
    router.push({
      pathname: "/permissions",
      params: {
        displayName: encodeURIComponent(name.trim()),
        avatarUri: avatarUri ? encodeURIComponent(avatarUri) : "",
      },
    });
  };

  return (
    <AppScreen
      scroll
      horizontalPadding="md"
      safeEdges={["top", "left", "right", "bottom"]}
      keyboardOffset={0}
    >
      <AuthHeader title="Hồ sơ" subtitle="Tên và ảnh có thể đổi sau trong Cài đặt." />

      <View style={{ alignItems: "center", marginBottom: spacing.md }}>
        <Pressable accessibilityRole="button" onPress={() => void pickAvatar()} disabled={busy}>
          <AppAvatar uri={avatarUri ?? undefined} name={name || " "} size="md" />
        </Pressable>
        <AppText
          variant="micro"
          color="primary"
          style={{ marginTop: spacing.xs }}
          onPress={() => void pickAvatar()}
        >
          {busy ? "Đang mở…" : "Chọn ảnh"}
        </AppText>
      </View>

      <AppInput
        label="Tên hiển thị"
        placeholder="Ví dụ: Lan Anh"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect
        compact
      />

      <View style={{ flex: 1, minHeight: spacing.xxl }} />

      <AppButton title="Tiếp tục" variant="primary" compact disabled={!canContinue} onPress={onContinue} />
    </AppScreen>
  );
}
