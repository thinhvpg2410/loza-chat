import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { AppText } from "@ui/AppText";
import { colors, radius, spacing, typography } from "@theme";

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

export function AppInput({
  label,
  error,
  containerStyle,
  style,
  editable = true,
  onBlur,
  onFocus,
  ...rest
}: AppInputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  const borderColor = hasError
    ? colors.danger
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={[{ width: "100%" }, containerStyle]}>
      {label ? (
        <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.xs }}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        editable={editable}
        placeholderTextColor={colors.textPlaceholder}
        style={[
          styles.input,
          typography.body,
          {
            borderColor,
            backgroundColor: editable ? colors.background : colors.surface,
            color: colors.text,
          },
          style,
        ]}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        {...rest}
      />
      {hasError ? (
        <AppText variant="caption" color="danger" style={{ marginTop: spacing.xs }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
