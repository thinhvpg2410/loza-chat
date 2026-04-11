import type { ReactNode } from "react";
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
  /** Tighter field for dense flows (e.g. auth). */
  compact?: boolean;
  /** Nút/icon bên phải (ví dụ hiện/ẩn mật khẩu). */
  endAdornment?: ReactNode;
};

export function AppInput({
  label,
  error,
  containerStyle,
  style,
  editable = true,
  compact = false,
  endAdornment,
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

  const inputShellStyle = [
    compact ? styles.inputCompact : styles.input,
    compact ? typography.subhead : typography.body,
    {
      backgroundColor: editable ? colors.background : colors.surface,
      color: colors.text,
    },
    style,
  ];

  return (
    <View style={[{ width: "100%" }, containerStyle]}>
      {label ? (
        <AppText
          variant={compact ? "micro" : "caption"}
          color="textSecondary"
          style={{ marginBottom: compact ? 4 : spacing.xs }}
        >
          {label}
        </AppText>
      ) : null}
      {endAdornment ? (
        <View
          style={[
            styles.inputRow,
            compact ? styles.inputRowCompact : styles.inputRowDefault,
            {
              borderColor,
              backgroundColor: editable ? colors.background : colors.surface,
            },
          ]}
        >
          <TextInput
            editable={editable}
            placeholderTextColor={colors.textPlaceholder}
            style={[inputShellStyle, styles.inputInRow]}
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
          <View style={styles.endAdornment}>{endAdornment}</View>
        </View>
      ) : (
        <TextInput
          editable={editable}
          placeholderTextColor={colors.textPlaceholder}
          style={[
            inputShellStyle,
            {
              borderColor,
            },
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
      )}
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
  inputCompact: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 0,
  },
  inputRowDefault: {
    minHeight: 44,
    paddingRight: spacing.xs,
  },
  inputRowCompact: {
    minHeight: 40,
    paddingRight: spacing.xs,
  },
  inputInRow: {
    flex: 1,
    minWidth: 0,
    borderWidth: 0,
    paddingRight: spacing.xs,
  },
  endAdornment: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: spacing.sm,
  },
});
