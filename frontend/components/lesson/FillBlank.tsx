"use client";

interface Props {
  sentence: string;
  value?: unknown;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function FillBlank({ sentence, value, onChange, disabled }: Props) {
  const parts = sentence.split("___");
  const strVal = value === undefined || value === null ? "" : String(value);
  return (
    <div className="space-y-4 text-lg">
      <p className="flex flex-wrap items-center gap-1 text-[var(--text-primary)]">
        {parts[0]}
        <input
          className="mx-1 min-w-[100px] rounded-xl border-2 border-[#1CB0F6] bg-[var(--bg-secondary)] px-3 py-1 text-center font-black text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[#1CB0F6]/30 disabled:opacity-60"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          size={Math.max(10, strVal.length + 2)}
        />
        {parts[1] || ""}
      </p>
    </div>
  );
}
