"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { friendsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";

export default function FriendsPage() {
  const token = getToken()!;
  const { data: friends, refetch } = useQuery<Array<{ id: number; username: string; avatar_url: string }>>({
    queryKey: ["friends"],
    queryFn: () => friendsApi.list(token),
  });
  const { data: pending } = useQuery<Array<{ friendship_id: number; user: { username: string } }>>({
    queryKey: ["pending"],
    queryFn: () => friendsApi.pending(token),
  });
  const { data: activity } = useQuery<Array<{ message: string; user: string }>>({
    queryKey: ["friend-activity"],
    queryFn: () => friendsApi.activity(token),
  });

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Friends 👥</h1>
        <Link
          href="/chat"
          className="rounded-2xl bg-[#58CC02] px-4 py-2 text-sm font-black text-white shadow-[0_4px_0_#46A302] transition hover:translate-y-px hover:shadow-none"
        >
          💬 Open Chat
        </Link>
      </div>

      {pending && pending.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
            Pending Requests ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.friendship_id}
                className="flex items-center justify-between rounded-2xl border-2 border-[#FFC800] bg-[var(--surface)] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFC800] font-black text-black">
                    {p.user.username[0]?.toUpperCase()}
                  </div>
                  <span className="font-black text-[var(--text-primary)]">{p.user.username}</span>
                </div>
                <button
                  className="rounded-xl bg-[#58CC02] px-4 py-2 text-sm font-black text-white"
                  onClick={() => friendsApi.accept(token, p.friendship_id).then(() => refetch())}
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
          Your Friends {friends ? `(${friends.length})` : ""}
        </p>
        {friends && friends.length === 0 && (
          <div className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-6 text-center">
            <p className="text-4xl">👋</p>
            <p className="mt-2 font-black text-[var(--text-primary)]">No friends yet</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Find learners on the leaderboard and send friend requests.
            </p>
            <Link
              href="/leaderboard"
              className="mt-4 inline-block rounded-2xl border-2 border-[#1CB0F6] px-5 py-2.5 text-sm font-black text-[#1CB0F6]"
            >
              Find Friends
            </Link>
          </div>
        )}
        <div className="space-y-2">
          {friends?.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-3"
            >
              {f.avatar_url ? (
                <img src={f.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1CB0F6] font-black text-white">
                  {f.username[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-black text-[var(--text-primary)]">{f.username}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
          Friend Activity
        </p>
        {(!activity || activity.length === 0) ? (
          <p className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-4 text-sm text-[var(--text-secondary)]">
            No recent activity. Add friends to see what they&apos;re up to!
          </p>
        ) : (
          <div className="space-y-2">
            {activity.map((a, i) => (
              <p
                key={i}
                className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-3 text-sm text-[var(--text-secondary)]"
              >
                <span className="font-black text-[var(--text-primary)]">{a.user}</span>: {a.message}
              </p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
