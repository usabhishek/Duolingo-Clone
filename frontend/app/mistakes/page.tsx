"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";

export default function MistakesPage() {
  const token = getToken()!;
  const { data, isLoading } = useQuery<
    Array<{
      exercise_id: number;
      prompt: string;
      user_answer: unknown;
      correct_answer: unknown;
      mistake_count: number;
      exercise_type: string;
      last_mistake_at: string;
    }>
  >({ queryKey: ["mistakes"], queryFn: () => analyticsApi.mistakes(token) });

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      <h1 className="text-2xl font-black text-[var(--text-primary)]">Mistake Journal 📝</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--bg-secondary)]" />
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="rounded-2xl border-2 border-[#58CC02] bg-[var(--surface)] p-6 text-center">
          <p className="text-4xl">🎉</p>
          <p className="mt-2 font-black text-[var(--text-primary)]">No mistakes yet!</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Keep it up — you&apos;re doing great.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.map((m) => (
            <div
              key={m.exercise_id}
              className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-4"
            >
              <p className="font-black text-[var(--text-primary)]">{m.prompt}</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2 rounded-xl bg-[#fff0f0] p-2.5 dark:bg-[#2d1515]">
                  <span className="text-sm font-black text-[#FF4B4B]">✗</span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#FF4B4B]">Your answer</p>
                    <p className="text-sm text-[var(--text-primary)]">{JSON.stringify(m.user_answer)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-[#f0fde4] p-2.5 dark:bg-[#152d0f]">
                  <span className="text-sm font-black text-[#58CC02]">✓</span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#58CC02]">Correct answer</p>
                    <p className="text-sm text-[var(--text-primary)]">{JSON.stringify(m.correct_answer)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span className="rounded-full bg-[var(--bg-primary)] px-2 py-0.5 font-bold capitalize">
                  {m.exercise_type.replace("_", " ")}
                </span>
                <span>·</span>
                <span>Mistakes: <span className="font-black text-[#FF4B4B]">{m.mistake_count}</span></span>
                <span>·</span>
                <span>{new Date(m.last_mistake_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
