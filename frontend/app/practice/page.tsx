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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setLoading(true);
    setError("");
    try {
      const s = await practiceApi.personalized(token);
      setSession(s as typeof session);
      setIdx(0);
      setAnswers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start practice session");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (answer: unknown) => {
    if (!session) return;
    const ex = session.exercises[idx];
    setAnswers([...answers, { exercise_id: ex.id, user_answer: answer }]);
    if (idx < session.exercises.length - 1) setIdx(idx + 1);
  };

  const progress = session ? ((idx / session.exercises.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <h1 className="text-2xl font-black text-[var(--text-primary)]">Personalized Practice 🎯</h1>

      {!session ? (
        <div className="rounded-[28px] border-2 border-[var(--border-color)] bg-[var(--surface)] p-8 text-center">
          <p className="text-5xl">🧠</p>
          <p className="mt-4 text-lg font-black text-[var(--text-primary)]">AI-Powered Review</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Practice exercises are tailored to your weaknesses.
          </p>
          {error && (
            <p className="mt-4 rounded-xl bg-[#fde4e4] px-4 py-3 text-sm font-bold text-[#c0392b] dark:bg-[#2d1515] dark:text-[#ff8d8d]">
              {error}
            </p>
          )}
          <button
            className="mt-6 rounded-2xl bg-[#58CC02] px-8 py-3 font-black uppercase tracking-wider text-white shadow-[0_4px_0_#46A302] transition hover:translate-y-px hover:shadow-none disabled:opacity-60"
            onClick={start}
            disabled={loading}
          >
            {loading ? "Loading..." : "Start Review"}
          </button>
        </div>
      ) : idx < session.exercises.length ? (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-3">
            <div className="mb-1.5 flex justify-between text-xs font-black text-[var(--text-secondary)]">
              <span>Question {idx + 1} of {session.exercises.length}</span>
              <span>Max {session.max_xp} XP</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-primary)]">
              <div
                className="h-full rounded-full bg-[#58CC02] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <ExerciseRenderer exercise={session.exercises[idx]} onSubmit={handleSubmit} />
        </div>
      ) : (
        <div className="rounded-[28px] border-2 border-[#58CC02] bg-[var(--surface)] p-8 text-center shadow-[inset_0_0_0_1px_rgba(88,204,2,0.2)]">
          <p className="text-5xl">🎉</p>
          <p className="mt-4 text-2xl font-black text-[var(--text-primary)]">Practice Complete!</p>
          <p className="mt-2 text-[var(--text-secondary)]">
            Max XP available: <span className="font-black text-[#FFC800]">⚡ {session.max_xp}</span>
          </p>
          <button
            className="mt-6 rounded-2xl bg-[#58CC02] px-8 py-3 font-black uppercase tracking-wider text-white shadow-[0_4px_0_#46A302] transition hover:translate-y-px hover:shadow-none"
            onClick={start}
          >
            Practice Again
          </button>
        </div>
      )}
    </div>
  );
}
