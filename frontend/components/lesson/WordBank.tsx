"use client";

interface Props {
  words: string[];
  selected?: string[] | null;
  onChange: (words: string[]) => void;
  disabled?: boolean;
}

/** Tap-to-build word bank answer */
export function WordBank({ words, selected, onChange, disabled }: Props) {
  const safeSelected = Array.isArray(selected) ? selected : [];
  const available = words.filter(
    (w) => !safeSelected.includes(w) || safeSelected.filter((s) => s === w).length < words.filter((x) => x === w).length,
  );

  const tapWord = (word: string, fromSelected: boolean) => {
    if (disabled) return;
    if (fromSelected) {
      const idx = safeSelected.lastIndexOf(word);
      if (idx >= 0) onChange([...safeSelected.slice(0, idx), ...safeSelected.slice(idx + 1)]);
    } else {
      onChange([...safeSelected, word]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="min-h-[60px] rounded-2xl border-2 border-dashed border-duo-blue p-4">
        <div className="flex flex-wrap gap-2">
          {safeSelected.map((w, i) => (
            <button
              key={`${w}-${i}`}
              type="button"
              className="rounded-xl bg-duo-blue px-3 py-1 font-bold text-white"
              onClick={() => tapWord(w, true)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {available.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            className="rounded-xl border-2 border-[var(--border-color)] bg-white px-4 py-2 font-bold text-slate-900 dark:bg-[#1A2C35] dark:text-white"
            onClick={() => tapWord(w, false)}
            disabled={disabled}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}
