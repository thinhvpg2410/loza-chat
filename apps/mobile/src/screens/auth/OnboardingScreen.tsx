import { Button } from "@/components/Button";
import { SCREEN_WIDTH } from "@/constants/layout";
import { ONBOARDING_COMPLETE_KEY } from "@/constants/storageKeys";
import type { RootStackParamList } from "@/navigation/types";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import { FlatList, Text, View, type ListRenderItem, type ViewToken } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SLIDES: Slide[] = [
  {
    key: "1",
    title: "Trò chuyện mọi lúc",
    subtitle: "Nhắn tin nhanh, ổn định và thân thiện như Zalo.",
    icon: "chatbubbles-outline",
  },
  {
    key: "2",
    title: "Gọi video HD",
    subtitle: "Kết nối trực tiếp với bạn bè và gia đình.",
    icon: "videocam-outline",
  },
  {
    key: "3",
    title: "Luôn kết nối",
    subtitle: "Danh bạ, nhóm chat và thông báo tức thì.",
    icon: "people-outline",
  },
];

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) setIndex(first.index);
    },
  ).current;

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Auth",
          state: { routes: [{ name: "Login" }], index: 0 },
        },
      ],
    });
  };

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ width: SCREEN_WIDTH }}
    >
      <View className="mb-8 h-28 w-28 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={item.icon} size={52} color="#0068FF" />
      </View>
      <Text className="mb-3 text-center text-2xl font-bold text-slate-900 dark:text-white">
        {item.title}
      </Text>
      <Text className="text-center text-base leading-6 text-slate-600 dark:text-slate-300">
        {item.subtitle}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <FlatList
        data={SLIDES}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
      />
      <SafeAreaView className="px-6 pb-2" edges={["bottom"]}>
        <View className="mb-6 flex-row items-center justify-center gap-2">
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              className={[
                "h-2 rounded-full",
                i === index ? "w-6 bg-primary" : "w-2 bg-slate-200 dark:bg-slate-700",
              ].join(" ")}
            />
          ))}
        </View>
        <Button title="Bắt đầu" onPress={finish} />
      </SafeAreaView>
    </SafeAreaView>
  );
}
