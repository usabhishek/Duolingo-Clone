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
          {/* Left sidebar */}
          <aside className="hidden w-[220px] flex-shrink-0 rounded-[28px] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 lg:block">
            <div className="mb-8 px-2 text-3xl font-black text-[#58CC02]">LinguaQuest</div>
            <nav className="space-y-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black uppercase tracking-[0.12em] transition ${
                    pathname === item.href
                      ? "bg-[#edfde0] text-[#2d7a00] shadow-[inset_0_0_0_1px_rgba(88,204,2,0.4)] dark:bg-[#1d3d48] dark:text-[#8ae9b6]"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
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

          {/* Right sidebar */}
          <aside className="hidden w-[300px] flex-shrink-0 xl:block">
            <div className="rounded-[28px] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
              <div className="mb-4 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                <span>Daily Quest</span>
                <button type="button" className="text-[#1CB0F6]">View all</button>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <div className="mb-2 flex items-center justify-between text-sm font-black text-[var(--text-primary)]">
                    <span>Earn 20 XP</span>
                    <span className="text-[#ffd54d]">20 / 20</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border-color)]">
                    <div className="h-full w-full rounded-full bg-[#ffde59]" />
                  </div>
                </div>
                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <div className="mb-2 flex items-center justify-between text-sm font-black text-[var(--text-primary)]">
                    <span>Score 80% in 2 lessons</span>
                    <span className="text-[#86efac]">1 / 2</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border-color)]">
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

      {/* Mobile bottom nav */}
      {authed && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--border-color)] bg-[var(--bg-secondary)] lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-black uppercase tracking-wider transition ${
                pathname === item.href
                  ? "text-[#58CC02]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
