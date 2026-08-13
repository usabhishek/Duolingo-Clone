"use client";

interface Option {
  id: string;
  text: string;
  image?: string;
}

interface Props {
  options: Option[];
  selected: string;
  onSelect: (id: string) => void;
  feedback?: { isCorrect: boolean; message: string } | null;
  disabled?: boolean;
  showImages?: boolean;
}

/** Polished multiple-choice / image-choice cards */
export function MultipleChoice({ options, selected, onSelect, feedback, disabled, showImages }: Props) {
  return (
    <div className="grid gap-3">
      {options.map((opt) => {
        let cls = "card cursor-pointer font-semibold transition hover:border-duo-blue";
        if (selected === opt.id) cls += " border-duo-blue bg-blue-50 dark:bg-blue-950";
        if (feedback && selected === opt.id) {
          cls = feedback.isCorrect
            ? "card border-duo-green bg-green-50 dark:bg-green-950"
            : "card border-duo-red bg-red-50 dark:bg-red-950";
        }
        if (disabled) cls += " pointer-events-none opacity-70";

        return (
          <button key={opt.id} type="button" className={cls} onClick={() => onSelect(opt.id)}>
            {showImages && opt.image && (
              <img src={opt.image} alt={opt.text} className="mx-auto mb-2 h-20 w-20" />
            )}
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}
