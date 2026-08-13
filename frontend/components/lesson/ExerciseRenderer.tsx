"use client";

import { useState } from "react";
import type { Exercise } from "@/types";
import { AudioButton } from "@/components/audio/AudioButton";
import { MultipleChoice } from "./MultipleChoice";
import { WordBank } from "./WordBank";
import { MatchPairs } from "./MatchPairs";
import { FillBlank } from "./FillBlank";
import { TypeAnswer } from "./TypeAnswer";
import { SpeechInput } from "./SpeechInput";

interface Props {
  exercise: Exercise;
  onSubmit: (answer: unknown) => void;
  disabled?: boolean;
  feedback?: { isCorrect: boolean; message: string } | null;
}

/** Renders the correct exercise UI based on type */
export function ExerciseRenderer({ exercise, onSubmit, disabled, feedback }: Props) {
  const [answer, setAnswer] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCheck = async () => {
    // don't allow empty answers (handles arrays and strings)
    const isEmptyArray = Array.isArray(answer) && (answer as any[]).length === 0;
    if (answer === null || answer === undefined || answer === "" || isEmptyArray) return;
    setSubmitting(true);
    try {
      await onSubmit(answer);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{exercise.prompt}</h2>

      {exercise.audio_text && (
        <AudioButton text={exercise.audio_text} language={exercise.language} />
      )}

      {exercise.type === "multiple_choice" && (
        <MultipleChoice
          options={(exercise.payload.options as Array<{ id: string; text: string; image?: string }>) || []}
          selected={answer as string}
          onSelect={setAnswer}
          feedback={feedback}
          disabled={disabled}
        />
      )}
      {exercise.type === "image_choice" && (
        <MultipleChoice
          options={(exercise.payload.options as Array<{ id: string; text: string; image?: string }>) || []}
          selected={answer as string}
          onSelect={setAnswer}
          feedback={feedback}
          disabled={disabled}
          showImages
        />
      )}
      {exercise.type === "word_bank" && (
        <WordBank
          words={(exercise.payload.word_bank as string[]) || []}
          selected={Array.isArray(answer) ? (answer as string[]) : []}
          onChange={(w) => setAnswer(w)}
          disabled={disabled}
        />
      )}
      {exercise.type === "match_pairs" && (
        <MatchPairs
          left={(exercise.payload.left_items as string[]) || []}
          right={(exercise.payload.right_items as string[]) || []}
          onComplete={setAnswer}
          disabled={disabled}
        />
      )}
      {exercise.type === "fill_blank" && (
        <FillBlank
          sentence={(exercise.payload.sentence as string) || ""}
          value={(answer as string) || ""}
          onChange={setAnswer}
          disabled={disabled}
        />
      )}
      {(exercise.type === "type_answer" || exercise.type === "audio") && (
        <TypeAnswer value={(answer as string) || ""} onChange={setAnswer} disabled={disabled} />
      )}
      {exercise.type === "speech" && (
        <SpeechInput value={(answer as string) || ""} onChange={setAnswer} disabled={disabled} language={exercise.language} />
      )}

      {!disabled && (
        <button
          className="btn-primary w-full"
          onClick={handleCheck}
          disabled={submitting || answer === null || answer === "" || (Array.isArray(answer) && (answer as any[]).length === 0)}
        >
          {submitting ? "Checking..." : "Check"}
        </button>
      )}
    </div>
  );
}
