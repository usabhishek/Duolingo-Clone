"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function TypeAnswer({ value, onChange, disabled }: Props) {
  return (
    <input
      type="text"
      className="w-full rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-lg font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#1CB0F6] disabled:opacity-60"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Type your answer..."
      autoFocus
    />
  );
}
