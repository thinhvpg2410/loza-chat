import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { colors, iconSizes, type IconSizeName } from "@theme";

type IonName = ComponentProps<typeof Ionicons>["name"];

type AppIconButtonProps = Omit<PressableProps, "children"> & {
  name: IonName;
  size?: IconSizeName;
  color?: string;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
};

const defaultHitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

export function AppIconButton({
  name,
  size = "md",
  color = colors.textSecondary,
  hitSlop = defaultHitSlop,
  style,
  disabled,
  ...rest
}: AppIconButtonProps) {
  const dim = iconSizes[size];

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={hitSlop}
      disabled={disabled}
      style={({ pressed }) => {
        const s: StyleProp<ViewStyle> = [
          {
            width: dim + 16,
            height: dim + 16,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          },
          style as ViewStyle,
        ];
        return s;
      }}
      {...rest}
    >
      <Ionicons name={name} size={dim} color={color} />
    </Pressable>
  );
}
