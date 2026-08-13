"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";

export default function AnalyticsPage() {
  const token = getToken()!;
  const { data } = useQuery<{
    total_exercises: number; accuracy: number; strongest_exercise_type: string;
    weakest_exercise_type: string; weakest_skill: string | null;
  }>({ queryKey: ["analytics"], queryFn: () => analyticsApi.get(token) });

  if (!data) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Analytics</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="card"><p className="text-2xl font-bold">{data.total_exercises}</p><p className="text-xs">Exercises</p></div>
        <div className="card"><p className="text-2xl font-bold">{Math.round(data.accuracy * 100)}%</p><p className="text-xs">Accuracy</p></div>
        <div className="card"><p className="text-sm font-bold">Strongest</p><p>{data.strongest_exercise_type}</p></div>
        <div className="card"><p className="text-sm font-bold">Weakest</p><p>{data.weakest_exercise_type}</p></div>
      </div>
      {data.weakest_skill && <p className="text-sm">Needs practice: <strong>{data.weakest_skill}</strong></p>}
    </div>
  );
}
