import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing } from "@theme";

const LENGTH = 6;

function codeToDigits(code: string): string[] {
  const only = code.replace(/\D/g, "").slice(0, LENGTH);
  return Array.from({ length: LENGTH }, (_, i) => only[i] ?? "");
}

type OTPInputProps = {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: string;
  compact?: boolean;
};

export function OTPInput({
  value,
  onChange,
  onComplete,
  disabled,
  error,
  compact = false,
}: OTPInputProps) {
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(() => codeToDigits(value));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    setDigits(codeToDigits(value));
  }, [value]);

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(LENGTH - 1, index));
    inputsRef.current[clamped]?.focus();
  };

  const commit = (nextDigits: string[]) => {
    const code = nextDigits.join("");
    onChange(code);
    if (code.length === LENGTH) {
      onComplete?.(code);
    }
  };

  const handleChange = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const next = codeToDigits(cleaned);
      setDigits(next);
      commit(next);
      focusIndex(Math.min(cleaned.length, LENGTH - 1));
      return;
    }
    const digit = cleaned.slice(-1) ?? "";
    const next = [...digits];
    if (digit) {
      next[index] = digit;
      setDigits(next);
      commit(next);
      if (index < LENGTH - 1) focusIndex(index + 1);
      return;
    }
    next[index] = "";
    setDigits(next);
    commit(next);
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== "Backspace") return;
    if (digits[index]) return;
    if (index === 0) return;
    const next = [...digits];
    next[index - 1] = "";
    setDigits(next);
    commit(next);
    focusIndex(index - 1);
  };

  return (
    <View style={styles.root}>
      <View style={compact ? styles.rowCompact : styles.rowDefault}>
        {digits.map((d, index) => {
          const isFocused = focusedIndex === index;
          const hasError = Boolean(error);
          return (
            <TextInput
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              value={d}
              onChangeText={(t) => handleChange(index, t)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={index === 0 ? LENGTH : 1}
              editable={!disabled}
              selectTextOnFocus
              style={[
                compact ? styles.cellCompact : styles.cellDefault,
                {
                  borderColor: hasError
                    ? colors.danger
                    : isFocused
                      ? colors.primary
                      : colors.border,
                  borderWidth: isFocused || hasError ? 1.5 : StyleSheet.hairlineWidth,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            />
          );
        })}
      </View>
      {error ? (
        <Text style={compact ? styles.errorCompact : styles.errorDefault}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  rowDefault: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  cellDefault: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  cellCompact: {
    width: 40,
    height: 44,
    flexShrink: 0,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  errorDefault: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontSize: 13,
    color: colors.danger,
  },
  errorCompact: {
    marginTop: spacing.xs,
    textAlign: "center",
    fontSize: 12,
    color: colors.danger,
  },
});
