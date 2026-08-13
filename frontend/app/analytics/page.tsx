"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";

export default function AnalyticsPage() {
  const token = getToken()!;
  const { data, isLoading } = useQuery<{
    total_exercises: number;
    accuracy: number;
    strongest_exercise_type: string;
    weakest_exercise_type: string;
    weakest_skill: string | null;
  }>({ queryKey: ["analytics"], queryFn: () => analyticsApi.get(token) });

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <h1 className="text-2xl font-black text-[var(--text-primary)]">Analytics 📊</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--bg-secondary)]" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-4 text-center">
              <p className="text-3xl font-black text-[#58CC02]">{data.total_exercises}</p>
              <p className="mt-1 text-xs font-bold text-[var(--text-secondary)]">Exercises Done</p>
            </div>
            <div className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-4 text-center">
              <p className="text-3xl font-black text-[#1CB0F6]">{Math.round(data.accuracy * 100)}%</p>
              <p className="mt-1 text-xs font-bold text-[var(--text-secondary)]">Accuracy</p>
            </div>
          </div>

          {/* Accuracy bar */}
          <div className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-5">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Overall Accuracy</p>
            <div className="h-4 overflow-hidden rounded-full bg-[var(--bg-primary)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#58CC02] to-[#1CB0F6] transition-all"
                style={{ width: `${Math.round(data.accuracy * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-right text-sm font-black text-[var(--text-primary)]">
              {Math.round(data.accuracy * 100)}%
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 border-[#58CC02] bg-[var(--surface)] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[#58CC02]">💪 Strongest</p>
              <p className="mt-2 font-black capitalize text-[var(--text-primary)]">
                {data.strongest_exercise_type?.replace("_", " ") || "—"}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[#FF9600] bg-[var(--surface)] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[#FF9600]">⚠️ Weakest</p>
              <p className="mt-2 font-black capitalize text-[var(--text-primary)]">
                {data.weakest_exercise_type?.replace("_", " ") || "—"}
              </p>
            </div>
          </div>

          {data.weakest_skill && (
            <div className="rounded-2xl border-2 border-[#FF9600] bg-[#fff8f0] p-4 dark:bg-[#2d1e00]">
              <p className="text-xs font-black uppercase tracking-wide text-[#FF9600]">Needs Practice</p>
              <p className="mt-1 font-black text-[var(--text-primary)]">{data.weakest_skill}</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
