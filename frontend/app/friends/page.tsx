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
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Friends</h1>
      <Link href="/chat" className="btn-primary inline-block">Open Chat</Link>

      {pending && pending.length > 0 && (
        <section>
          <h2 className="font-bold">Pending Requests</h2>
          {pending.map((p) => (
            <div key={p.friendship_id} className="card flex justify-between">
              <span>{p.user.username}</span>
              <button className="text-duo-green font-bold" onClick={() => friendsApi.accept(token, p.friendship_id).then(() => refetch())}>
                Accept
              </button>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="font-bold">Your Friends</h2>
        {friends && friends.length === 0 && (
          <div className="card text-center">
            <p className="font-bold">You have no friends yet</p>
            <p className="text-sm text-[var(--text-secondary)]">Find learners on the leaderboard and send friend requests.</p>
            <Link href="/leaderboard" className="btn-secondary mt-2 inline-block">Find Friends</Link>
          </div>
        )}
        {friends?.map((f) => (
          <div key={f.id} className="card flex items-center gap-3">
            <img src={f.avatar_url} alt="" className="h-10 w-10 rounded-full" />
            <span className="font-bold">{f.username}</span>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-bold">Friend Activity</h2>
        {(!activity || activity.length === 0) && (
          <p className="text-sm text-[var(--text-secondary)]">No recent friend activity. Add friends to chat and see activity here.</p>
        )}
        {activity?.map((a, i) => (
          <p key={i} className="text-sm text-[var(--text-secondary)]">{a.user}: {a.message}</p>
        ))}
      </section>
    </div>
  );
}
