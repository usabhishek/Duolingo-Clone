"use client";

import { useQuery } from "@tanstack/react-query";
import { leaderboardApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";

export default function LeaderboardPage() {
  const token = getToken()!;
  const { data, isLoading } = useQuery<{
    entries: Array<{
      rank: number;
      username: string;
      display_name: string;
      avatar_url: string;
      total_xp: number;
      is_current_user: boolean;
    }>;
    current_user_rank: number;
  }>({
    queryKey: ["leaderboard"],
    queryFn: () => leaderboardApi.get(token),
  });

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Leaderboard 🏆</h1>
        {data?.current_user_rank && (
          <span className="text-sm font-bold text-[var(--text-secondary)]">
            Your rank: <span className="font-black text-[#58CC02]">#{data.current_user_rank}</span>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--bg-secondary)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.entries?.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 rounded-2xl border-2 bg-[var(--surface)] p-3 transition ${
                entry.is_current_user
                  ? "border-[#58CC02] shadow-[inset_0_0_0_1px_rgba(88,204,2,0.3)]"
                  : "border-[var(--border-color)]"
              }`}
            >
              <span className="w-8 text-center text-lg font-black">
                {rankEmoji(entry.rank) ?? (
                  <span className="text-sm text-[var(--text-secondary)">#{entry.rank}</span>
                )}
              </span>
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover bg-[var(--bg-primary)]" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#58CC02] text-lg font-black text-white">
                  {(entry.display_name || entry.username)?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-black text-[var(--text-primary)]">
                  {entry.display_name}
                  {entry.is_current_user && (
                    <span className="ml-2 rounded-full bg-[#edfde0] px-2 py-0.5 text-[10px] font-black uppercase text-[#2d7a00] dark:bg-[#1d3d48] dark:text-[#8ae9b6]">
                      You
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">@{entry.username}</p>
              </div>
              <span className="font-black text-[#FFC800]">
                ⚡ {entry.total_xp.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
