import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, View } from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing } from "@theme";

export type CountryOption = {
  dial: string;
  label: string;
  flag: string;
};

const DEFAULT_COUNTRIES: CountryOption[] = [
  { dial: "+84", label: "Việt Nam", flag: "🇻🇳" },
  { dial: "+1", label: "Hoa Kỳ", flag: "🇺🇸" },
];

type PhoneCountryRowProps = {
  value: CountryOption;
  onChange: (next: CountryOption) => void;
};

export function PhoneCountryRow({ value, onChange }: PhoneCountryRowProps) {
  const openPicker = () => {
    Alert.alert(
      "Mã vùng",
      "Chọn quốc gia (mock)",
      [
        ...DEFAULT_COUNTRIES.map((c) => ({
          text: `${c.flag} ${c.dial} ${c.label}`,
          onPress: () => onChange(c),
        })),
        { text: "Đóng", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={openPicker}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <AppText variant="subhead">{value.flag}</AppText>
        <AppText variant="subhead" style={{ fontWeight: "600", color: colors.text }}>
          {value.dial}
        </AppText>
      </View>
      <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
    </Pressable>
  );
}
