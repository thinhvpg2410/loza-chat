import { Text, type TextProps, type TextStyle } from "react-native";

import { colors, typography, type TypographyVariant } from "@theme";

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  /** Theme color key or any CSS color string */
  color?: keyof typeof colors | string;
};

function resolveColor(c: AppTextProps["color"]): string {
  if (c === undefined) {
    return colors.text;
  }
  if (typeof c === "string" && c in colors) {
    return colors[c as keyof typeof colors];
  }
  return c;
}

export function AppText({
  variant = "body",
  color,
  style,
  ...rest
}: AppTextProps) {
  const base: TextStyle = typography[variant];
  const colorStyle: TextStyle = { color: resolveColor(color) };

  return <Text style={[base, colorStyle, style]} {...rest} />;
}
