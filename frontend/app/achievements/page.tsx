"use client";

import { useQuery } from "@tanstack/react-query";
import { achievementsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";

export default function AchievementsPage() {
  const token = getToken()!;
  const { data, isLoading } = useQuery<
    Array<{ id: number; title: string; description: string; unlocked: boolean; gem_reward: number }>
  >({
    queryKey: ["achievements"],
    queryFn: () => achievementsApi.list(token),
  });

  const unlocked = data?.filter((a) => a.unlocked) ?? [];
  const locked = data?.filter((a) => !a.unlocked) ?? [];

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Achievements</h1>
        {data && (
          <span className="text-sm font-bold text-[var(--text-secondary)]">
            <span className="font-black text-[#58CC02]">{unlocked.length}</span>/{data.length} unlocked
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-secondary)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {unlocked.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-4 rounded-2xl border-2 border-[#58CC02] bg-[var(--surface)] p-4 shadow-[inset_0_0_0_1px_rgba(88,204,2,0.2)]"
            >
              <span className="text-3xl">🏆</span>
              <div className="flex-1">
                <p className="font-black text-[var(--text-primary)]">{a.title}</p>
                <p className="text-sm text-[var(--text-secondary)]">{a.description}</p>
                {a.gem_reward > 0 && (
                  <p className="mt-1 text-xs font-black text-[#1CB0F6]">+{a.gem_reward} 💎 gems</p>
                )}
              </div>
              <span className="rounded-full bg-[#edfde0] px-2.5 py-1 text-xs font-black text-[#2d7a00] dark:bg-[#1d3d48] dark:text-[#8ae9b6]">
                Earned
              </span>
            </div>
          ))}

          {locked.length > 0 && (
            <>
              <p className="pt-2 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
                Locked
              </p>
              {locked.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-4 opacity-50"
                >
                  <span className="text-3xl">🔒</span>
                  <div className="flex-1">
                    <p className="font-black text-[var(--text-primary)]">{a.title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{a.description}</p>
                    {a.gem_reward > 0 && (
                      <p className="mt-1 text-xs font-bold text-[var(--text-secondary)]">+{a.gem_reward} gems</p>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
