import type { ComponentProps } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";

import { AuthHeader, PermissionItemCard } from "@components/auth";
import { completeMockOnboardingSession } from "@lib/auth-mock";
import { AppButton } from "@ui/AppButton";
import { AppScreen } from "@ui/AppScreen";
import { AppText } from "@ui/AppText";
import { useAuthStore } from "@/store/authStore";
import { spacing } from "@theme";

type PermissionKey = "notifications" | "contacts" | "photos" | "microphone" | "location";

type ItemIcon = ComponentProps<typeof PermissionItemCard>["icon"];

const ITEMS: {
  key: PermissionKey;
  icon: ItemIcon;
  title: string;
  subtitle: string;
}[] = [
  {
    key: "notifications",
    icon: "notifications-outline",
    title: "Thông báo",
    subtitle: "Tin nhắn & cuộc gọi kịp thời.",
  },
  {
    key: "contacts",
    icon: "people-outline",
    title: "Danh bạ",
    subtitle: "Tìm bạn đang dùng app.",
  },
  {
    key: "photos",
    icon: "images-outline",
    title: "Ảnh & video",
    subtitle: "Gửi và lưu nội dung.",
  },
  {
    key: "microphone",
    icon: "mic-outline",
    title: "Micro",
    subtitle: "Gọi thoại, ghi âm.",
  },
  {
    key: "location",
    icon: "location-outline",
    title: "Vị trí",
    subtitle: "Chia sẻ khi bạn cho phép.",
  },
];

export default function PermissionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ displayName?: string; avatarUri?: string }>();
  const phone = useAuthStore((s) => s.phone);

  const displayName = useMemo(() => {
    const raw = params.displayName ? decodeURIComponent(params.displayName) : "";
    return raw.trim() || "Bạn";
  }, [params.displayName]);

  const [allowed, setAllowed] = useState<Record<PermissionKey, boolean>>({
    notifications: false,
    contacts: false,
    photos: false,
    microphone: false,
    location: false,
  });

  const [finishing, setFinishing] = useState(false);

  const allow = useCallback((key: PermissionKey) => {
    setAllowed((prev) => ({ ...prev, [key]: true }));
  }, []);

  const avatarUri = params.avatarUri ? decodeURIComponent(params.avatarUri) : "";

  const finish = async () => {
    setFinishing(true);
    try {
      const phoneE164 = phone || "+84900000000";
      await completeMockOnboardingSession({
        displayName,
        phoneE164,
        avatarUri: avatarUri || null,
      });
      router.replace("/main");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <AppScreen scroll horizontalPadding="md" safeEdges={["top", "left", "right", "bottom"]}>
      <AuthHeader showBack={false} title="Quyền truy cập" subtitle="Đổi lại bất cứ lúc nào trong Cài đặt." />

      <AppText variant="micro" color="textMuted" style={{ marginBottom: spacing.sm, lineHeight: 16 }}>
        Xin chào {displayName}. Các quyền dưới đây là mock.
      </AppText>

      {ITEMS.map((item) => (
        <PermissionItemCard
          key={item.key}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          allowed={allowed[item.key]}
          onAllow={() => allow(item.key)}
        />
      ))}

      <View style={{ height: spacing.sm }} />

      <AppButton title="Vào ứng dụng" variant="primary" compact loading={finishing} onPress={() => void finish()} />

      <AppText
        variant="micro"
        color="primary"
        style={{ textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.xs }}
        onPress={() => void finish()}
      >
        Bỏ qua
      </AppText>
    </AppScreen>
  );
}
