import { forwardRef } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerClassName?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, containerClassName, ...rest },
  ref,
) {
  return (
    <View className={["w-full", containerClassName].filter(Boolean).join(" ")}>
      {label ? (
        <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#94a3b8"
        className={[
          "rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
          error ? "border-red-500" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {error ? <Text className="mt-1.5 text-sm text-red-500">{error}</Text> : null}
    </View>
  );
});
