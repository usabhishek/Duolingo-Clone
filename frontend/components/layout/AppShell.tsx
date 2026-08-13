"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/gamification/TopBar";
import { getToken } from "@/lib/auth/tokens";

const NAV = [
  { href: "/", label: "Learn", icon: "🏠" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/friends", label: "Friends", icon: "👥" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const hideNav = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/lesson");

  useEffect(() => {
    setAuthed(!!getToken());
  }, [pathname]);

  if (hideNav) return <>{children}</>;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {authed && <TopBar />}
      {authed ? (
        <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-5">
          <aside className="hidden w-[220px] flex-shrink-0 rounded-[28px] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 lg:block">
            <div className="mb-8 px-2 text-3xl font-black text-[#58CC02]">LinguaQuest</div>
            <nav className="space-y-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black uppercase tracking-[0.12em] transition ${
                    pathname === item.href
                      ? "bg-[#1d3d48] text-[#8ae9b6] shadow-[inset_0_0_0_1px_rgba(88,204,2,0.5)]"
                      : "text-[#dfeaf0] hover:bg-[#1b2d37]"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0 overflow-x-hidden">
            <div className="mx-auto w-full max-w-[820px]">{children}</div>
          </main>

          <aside className="hidden w-[300px] flex-shrink-0 xl:block">
            <div className="rounded-[28px] border border-[#213741] bg-[#0f2029] p-4">
              <div className="mb-4 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-[#95a8b3]">
                <span>Daily Quest</span>
                <button type="button" className="text-[#7dd3fc]">View all</button>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#0b1d30] p-3">
                  <div className="mb-2 flex items-center justify-between text-sm font-black text-[#f0f7ff]">
                    <span>Earn 20 XP</span>
                    <span className="text-[#ffd54d]">20 / 20</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1a2e39]">
                    <div className="h-full w-full rounded-full bg-[#ffde59]" />
                  </div>
                </div>
                <div className="rounded-2xl bg-[#0b1d30] p-3">
                  <div className="mb-2 flex items-center justify-between text-sm font-black text-[#f0f7ff]">
                    <span>Score 80% in 2 lessons</span>
                    <span className="text-[#86efac]">1 / 2</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1a2e39]">
                    <div className="h-full w-1/2 rounded-full bg-[#4ade80]" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <main className="mx-auto w-full max-w-2xl overflow-x-hidden px-4 py-4">{children}</main>
      )}
    </div>
  );
}
