import type { InputHTMLAttributes } from "react";
import { IconSearch } from "@/components/chat/icons";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  containerClassName?: string;
};

export function SearchInput({ className = "", containerClassName = "", ...props }: SearchInputProps) {
  return (
    <div className={`relative min-w-0 flex-1 ${containerClassName}`}>
      <IconSearch
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--zalo-text-muted)]"
        aria-hidden
      />
      <input
        type="search"
        className={`h-8 w-full rounded-full border border-transparent bg-[var(--zalo-surface)] pl-8 pr-2.5 text-[13px] text-[var(--zalo-text)] outline-none placeholder:text-[var(--zalo-text-muted)] focus:border-[var(--zalo-blue)] focus:ring-1 focus:ring-[var(--zalo-blue)]/25 ${className}`}
        autoComplete="off"
        {...props}
      />
    </div>
  );
}
