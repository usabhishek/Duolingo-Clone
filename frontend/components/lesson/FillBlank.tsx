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
      <p>
        {parts[0]}
        <input
          className="mx-2 rounded-lg border-2 border-duo-blue bg-transparent px-3 py-1 font-bold outline-none dark:text-black"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {parts[1] || ""}
      </p>
    </div>
  );
}
