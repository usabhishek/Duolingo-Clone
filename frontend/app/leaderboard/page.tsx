"use client";

import { useQuery } from "@tanstack/react-query";
import { leaderboardApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";

export default function LeaderboardPage() {
  const token = getToken()!;
  const { data, isLoading } = useQuery<{ entries: Array<{ rank: number; username: string; display_name: string; avatar_url: string; total_xp: number; is_current_user: boolean }>; current_user_rank: number }>({
    queryKey: ["leaderboard"],
    queryFn: () => leaderboardApi.get(token),
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Leaderboard 🏆</h1>
      <p className="text-sm text-[var(--text-secondary)]">Your rank: #{data?.current_user_rank}</p>
      <div className="space-y-2">
        {data?.entries?.map((entry) => (
          <div
            key={entry.rank}
            className={`card flex items-center gap-3 ${entry.is_current_user ? "border-duo-green ring-2 ring-duo-green" : ""}`}
          >
            <span className="w-8 text-lg font-extrabold text-[var(--text-secondary)]">#{entry.rank}</span>
            <img src={entry.avatar_url} alt="" className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <p className="font-bold">{entry.display_name}</p>
              <p className="text-xs text-[var(--text-secondary)]">@{entry.username}</p>
            </div>
            <span className="font-bold text-duo-yellow">{entry.total_xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
