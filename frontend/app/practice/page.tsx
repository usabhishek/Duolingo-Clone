"use client";

import { useState } from "react";
import { practiceApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";
import { ExerciseRenderer } from "@/components/lesson/ExerciseRenderer";
import type { Exercise } from "@/types";

export default function PracticePage() {
  const token = getToken()!;
  const [session, setSession] = useState<{ session_id: number; exercises: Exercise[]; max_xp: number } | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Array<{ exercise_id: number; user_answer: unknown }>>([]);

  const start = async () => {
    const s = await practiceApi.personalized(token);
    setSession(s as typeof session);
    setIdx(0);
    setAnswers([]);
  };

  const handleSubmit = (answer: unknown) => {
    if (!session) return;
    const ex = session.exercises[idx];
    setAnswers([...answers, { exercise_id: ex.id, user_answer: answer }]);
    if (idx < session.exercises.length - 1) setIdx(idx + 1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Personalized Practice</h1>
      {!session ? (
        <button className="btn-primary" onClick={start}>Start Review</button>
      ) : idx < session.exercises.length ? (
        <ExerciseRenderer exercise={session.exercises[idx]} onSubmit={handleSubmit} />
      ) : (
        <div className="text-center">
          <p className="text-xl font-bold">Practice complete!</p>
          <p className="text-sm text-[var(--text-secondary)]">Max XP: {session.max_xp}</p>
          <button className="btn-primary mt-4" onClick={start}>Practice Again</button>
        </div>
      )}
    </div>
  );
}
