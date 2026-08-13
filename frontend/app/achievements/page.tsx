"use client";

import { useQuery } from "@tanstack/react-query";
import { achievementsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";

export default function AchievementsPage() {
  const token = getToken()!;
  const { data } = useQuery<Array<{ id: number; title: string; description: string; unlocked: boolean; gem_reward: number }>>({
    queryKey: ["achievements"],
    queryFn: () => achievementsApi.list(token),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Achievements</h1>
      <div className="grid gap-3">
        {data?.map((a) => (
          <div key={a.id} className={`card flex items-center gap-4 ${a.unlocked ? "" : "opacity-50"}`}>
            <span className="text-3xl">{a.unlocked ? "🏆" : "🔒"}</span>
            <div>
              <p className="font-bold">{a.title}</p>
              <p className="text-sm text-[var(--text-secondary)]">{a.description}</p>
              {a.gem_reward > 0 && <p className="text-xs text-duo-blue">+{a.gem_reward} gems</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
