"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { gamificationApi } from "@/lib/api";
import { getToken, clearTokens } from "@/lib/auth/tokens";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/common/ThemeProvider";

/** Duolingo-inspired top bar */
export function TopBar() {
  const token = getToken();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["stats"],
    queryFn: () => gamificationApi.stats(token!),
    enabled: !!token,
    refetchInterval: 60_000,
  });

  const stats = data;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-lg font-black text-[#58CC02]">
          <span className="text-xl">🦉</span>
          <span className="hidden sm:inline">LinguaQuest</span>
        </Link>

        <div className="hidden items-center gap-3 text-xs font-black text-[var(--text-primary)] md:flex">
          <div className="rounded-full bg-[var(--bg-primary)] px-2.5 py-1.5">🔥 {stats?.current_streak ?? 0}</div>
          <div className="rounded-full bg-[var(--bg-primary)] px-2.5 py-1.5">⚡ {stats?.total_xp ?? 0}</div>
          <div className="rounded-full bg-[var(--bg-primary)] px-2.5 py-1.5 text-[#ff7b7b]">❤️ {stats?.hearts ?? 5}</div>
          <div className="rounded-full bg-[var(--bg-primary)] px-2.5 py-1.5 text-[#73d5ff]">💎 {stats?.gems ?? 0}</div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => {
              clearTokens();
              router.push("/login");
            }}
            className="rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-primary)]"
          >
            Logout
          </button>
        </div>
      </div>

      {stats && (
        <div className="mx-auto max-w-[1400px] px-4 pb-2">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-primary)]">
            <div
              className="h-full rounded-full bg-[#ffcc00] transition-all"
              style={{ width: `${Math.min(100, (stats.today_xp / Math.max(stats.daily_xp_goal, 1)) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
            Daily goal: {stats.today_xp}/{stats.daily_xp_goal} XP
          </p>
        </div>
      )}
    </header>
  );
}
