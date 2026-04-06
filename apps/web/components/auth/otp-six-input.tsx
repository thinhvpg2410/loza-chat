type OtpSixInputProps = {
  id: string;
  label: string;
  /** Optional hint below label (e.g. where the code was sent). */
  hint?: string;
  name?: string;
  disabled?: boolean;
  inputClassName: string;
};

export function OtpSixInput({
  id,
  label,
  hint,
  name = "otp",
  disabled,
  inputClassName,
}: OtpSixInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-medium text-[var(--zalo-text-subtle)]">
        {label}
      </label>
      {hint ? (
        <p className="text-[11px] leading-snug text-[var(--zalo-text-muted)]">{hint}</p>
      ) : null}
      <input
        id={id}
        name={name}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        disabled={disabled}
        placeholder="••••••"
        className={`${inputClassName} tracking-[0.2em]`}
      />
    </div>
  );
}
