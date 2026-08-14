"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LearningPath } from "@/components/learning/LearningPath";
import { coursesApi, analyticsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";
import Link from "next/link";

/** Duolingo-inspired dashboard */
export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const nextToken = getToken();
    setToken(nextToken);
    setHydrated(true);

    if (!nextToken) {
      router.replace("/login");
    }
  }, [router]);

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => coursesApi.list(token!),
    enabled: !!token,
  });

  const { data: path, refetch } = useQuery({
    queryKey: ["path"],
    queryFn: () => coursesApi.path(token!),
    enabled: !!token,
  });

  const { data: recommendations } = useQuery<{
    recommended_skill?: { id: number; title: string };
    reason?: string;
  }>({
    queryKey: ["recommendations"],
    queryFn: () => analyticsApi.recommendations(token!),
    enabled: !!token,
  });

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#58CC02] border-t-transparent" />
          <p className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-[var(--bg-primary)]">
        <div className="w-full max-w-md rounded-[28px] border-2 border-[var(--border-color)] bg-[var(--surface)] p-8 text-center shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
          <div className="mb-4 text-5xl">🔐</div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Sign in to continue to LinguaQuest.</p>
          <Link href="/login" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[#58CC02] px-6 py-3 font-black uppercase tracking-[0.12em] text-white shadow-[0_4px_0_#46A302] transition hover:translate-y-px hover:shadow-none">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const activeCourse = path?.course?.id ?? courses?.[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div className="rounded-[26px] border border-[var(--border-color)] bg-[var(--surface)] p-3">
        <div className="mb-2 flex items-center justify-between gap-3 px-2">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-secondary)]">Language</div>
          <div className="text-xs font-bold text-[var(--text-primary)]">{path?.course.title || "Select a course"}</div>
        </div>

        <div className="space-y-2">
          {courses?.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={async () => {
                await coursesApi.setActiveCourse(token!, course.id);
                refetch();
              }}
              className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-4 text-left transition ${
                activeCourse === course.id
                  ? "border-[#58CC02] bg-[#143f2a] text-[#eafbf1] shadow-[inset_0_0_0_1px_rgba(88,204,2,0.5)]"
                  : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <div>
                <div className="text-2xl font-black">{course.title}</div>
                <div className="text-sm text-[var(--text-secondary)]">{course.language_code || "Beginner"}</div>
              </div>
              <span className="rounded-full bg-[#d9e9ef] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a2d36]">
                {activeCourse === course.id ? "Active" : "Open"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {recommendations?.recommended_skill && (
        <div className="rounded-[26px] border border-[#f1b340] bg-[var(--bg-secondary)] p-4 shadow-[inset_0_0_0_1px_rgba(255,191,0,0.15)]">
          <div className="text-sm font-black uppercase tracking-[0.16em] text-[#ffbf4d]">Personalized Review</div>
          <div className="mt-2 text-xl font-black text-[var(--text-primary)]">Weakest: {recommendations.recommended_skill.title}</div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{recommendations.reason}</p>
          <Link href="/practice" className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[#58CC02] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#0e1d26]">
            Start Review
          </Link>
        </div>
      )}

      {path && <LearningPath units={path.units} />}
    </div>
  );
}
