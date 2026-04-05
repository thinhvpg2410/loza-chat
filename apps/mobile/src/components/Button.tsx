import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";

type ButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  loading?: boolean;
  variant?: "primary" | "ghost";
  textClassName?: string;
};

export function Button({
  title,
  loading = false,
  disabled,
  variant = "primary",
  className,
  textClassName,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const base =
    "min-h-[52px] w-full items-center justify-center rounded-2xl px-4 active:opacity-90";
  const variants =
    variant === "primary"
      ? "bg-primary"
      : "border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";
  const disabledCls = isDisabled ? "opacity-50" : "";

  const textBase = "text-center text-base font-semibold";
  const textVariants =
    variant === "primary" ? "text-white" : "text-slate-900 dark:text-slate-100";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={[base, variants, disabledCls, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#ffffff" : "#0068FF"} />
      ) : (
        <Text className={[textBase, textVariants, textClassName].filter(Boolean).join(" ")}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
