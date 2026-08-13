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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-extrabold">Profile</h1>
      </div>
      {user && (
        <div className="card flex items-center gap-4">
          <img src={user.avatar_url} alt="" className="h-20 w-20 rounded-full bg-duo-green object-cover" />
          <div>
            <h2 className="text-xl font-bold">{user.display_name}</h2>
            <p className="text-[var(--text-secondary)]">@{user.username}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total XP" value={user?.total_xp ?? 0} icon="⚡" />
        <StatCard label="Streak" value={user?.current_streak ?? 0} icon="🔥" />
        <StatCard label="Gems" value={user?.gems ?? 0} icon="💎" />
        <StatCard label="Lessons" value={user?.lessons_completed ?? 0} icon="📚" />
      </div>
      {health && (
        <div className="card">
          <h3 className="font-bold">Learning Health</h3>
          <p className="text-3xl font-extrabold text-duo-green">{health.score}/100</p>
          <p className="text-sm">{health.category} — {health.explanation}</p>
        </div>
      )}
      <div className="flex gap-2">
        <Link href="/achievements" className="btn-secondary flex-1 text-center">Achievements</Link>
        <Link href="/mistakes" className="btn-secondary flex-1 text-center">Mistakes</Link>
        <Link href="/analytics" className="btn-secondary flex-1 text-center">Analytics</Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card text-center">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}
