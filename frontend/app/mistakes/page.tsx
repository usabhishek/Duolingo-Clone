"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";

export default function MistakesPage() {
  const token = getToken()!;
  const { data } = useQuery<Array<{
    exercise_id: number; prompt: string; user_answer: unknown; correct_answer: unknown;
    mistake_count: number; exercise_type: string; last_mistake_at: string;
  }>>({ queryKey: ["mistakes"], queryFn: () => analyticsApi.mistakes(token) });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Mistake Journal</h1>
      {data?.length === 0 && <p className="text-[var(--text-secondary)]">No mistakes yet — great job!</p>}
      {data?.map((m) => (
        <div key={m.exercise_id} className="card space-y-2">
          <p className="font-bold">{m.prompt}</p>
          <p className="text-sm text-duo-red">Your answer: {JSON.stringify(m.user_answer)}</p>
          <p className="text-sm text-duo-green">Correct: {JSON.stringify(m.correct_answer)}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {m.exercise_type} · Mistakes: {m.mistake_count} · Last: {m.last_mistake_at}
          </p>
        </div>
      ))}
    </div>
  );
}
