import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";

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
};

export function OTPInput({ value, onChange, onComplete, disabled, error }: OTPInputProps) {
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(() => codeToDigits(value));

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
    <View className="w-full">
      <View className="flex-row justify-between gap-2">
        {digits.map((d, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            value={d}
            onChangeText={(t) => handleChange(index, t)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={index === 0 ? LENGTH : 1}
            editable={!disabled}
            selectTextOnFocus
            className={[
              "h-12 flex-1 rounded-xl border bg-white text-center text-lg font-semibold text-slate-900 dark:bg-slate-900 dark:text-slate-100",
              error ? "border-red-500" : "border-slate-200 dark:border-slate-600",
            ].join(" ")}
          />
        ))}
      </View>
      {error ? <Text className="mt-2 text-center text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
