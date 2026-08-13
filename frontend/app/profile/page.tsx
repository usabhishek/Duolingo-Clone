"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { analyticsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";
import Link from "next/link";

export default function ProfilePage() {
  const token = getToken()!;
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => authApi.me(token) });
  const { data: health } = useQuery<{ score: number; category: string; explanation: string }>({
    queryKey: ["health"],
    queryFn: () => analyticsApi.learningHealth(token),
  });
  const { data: analytics } = useQuery({ queryKey: ["analytics"], queryFn: () => analyticsApi.get(token) });

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <h1 className="text-2xl font-black text-[var(--text-primary)]">Profile</h1>

      {user && (
        <div className="flex items-center gap-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-5">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-20 w-20 rounded-full object-cover ring-4 ring-[#58CC02]"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#58CC02] text-3xl font-black text-white ring-4 ring-[#46A302]">
              {(user.display_name || user.username)?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">{user.display_name}</h2>
            <p className="text-sm text-[var(--text-secondary)]">@{user.username}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{user.email}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total XP" value={user?.total_xp ?? 0} icon="⚡" color="#FFC800" />
        <StatCard label="Streak" value={user?.current_streak ?? 0} icon="🔥" color="#FF9600" />
        <StatCard label="Gems" value={user?.gems ?? 0} icon="💎" color="#1CB0F6" />
        <StatCard label="Lessons" value={user?.lessons_completed ?? 0} icon="📚" color="#58CC02" />
      </div>

      {health && (
        <div className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-5">
          <h3 className="mb-3 font-black text-[var(--text-primary)]">Learning Health</h3>
          <div className="mb-3 flex items-baseline gap-2">
            <p className="text-4xl font-black text-[#58CC02]">{health.score}</p>
            <p className="text-[var(--text-secondary)]">/100</p>
          </div>
          <div className="mb-2 h-3 overflow-hidden rounded-full bg-[var(--bg-primary)]">
            <div
              className="h-full rounded-full bg-[#58CC02] transition-all"
              style={{ width: `${health.score}%` }}
            />
          </div>
          <p className="text-sm font-bold text-[var(--text-secondary)]">
            {health.category} — {health.explanation}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href="/achievements"
          className="flex-1 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] py-3 text-center text-sm font-black text-[#1CB0F6] shadow-[0_4px_0_var(--border-color)] transition hover:translate-y-px hover:shadow-none"
        >
          🏆 Achievements
        </Link>
        <Link
          href="/mistakes"
          className="flex-1 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] py-3 text-center text-sm font-black text-[#FF4B4B] shadow-[0_4px_0_var(--border-color)] transition hover:translate-y-px hover:shadow-none"
        >
          📝 Mistakes
        </Link>
        <Link
          href="/analytics"
          className="flex-1 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] py-3 text-center text-sm font-black text-[#58CC02] shadow-[0_4px_0_var(--border-color)] transition hover:translate-y-px hover:shadow-none"
        >
          📊 Analytics
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-4 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="mt-1 text-2xl font-black" style={{ color }}>{value.toLocaleString()}</p>
      <p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}
