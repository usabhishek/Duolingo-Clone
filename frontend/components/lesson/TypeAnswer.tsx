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
      className="w-full rounded-2xl border-2 border-[var(--border-color)] bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-duo-blue dark:bg-[#1A2C35] dark:text-black"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Type your answer..."
      autoFocus
    />
  );
}
