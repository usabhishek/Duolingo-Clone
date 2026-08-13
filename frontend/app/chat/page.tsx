"use client";

import { useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/auth/tokens";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

/** Real-time friend chat via WebSocket */
export default function ChatPage() {
  const token = getToken();
  const [messages, setMessages] = useState<Array<{ content: string; sender_id: number; created_at: string }>>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [recipientId, setRecipientId] = useState(2);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`${WS_URL}/ws/chat?token=${token}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "message") setMessages((m) => [...m, data]);
    };
    return () => ws.close();
  }, [token]);

  const send = () => {
    if (!input.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "message", recipient_id: recipientId, content: input }));
    setInput("");
  };

  return (
    <div className="flex h-[80vh] flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Chat</h1>
        <span className={`text-sm ${connected ? "text-duo-green" : "text-duo-red"}`}>
          {connected ? "● Connected" : "○ Disconnected"}
        </span>
      </div>
      <input
        type="number"
        className="my-2 rounded-lg border px-2 py-1 text-sm"
        value={recipientId}
        onChange={(e) => setRecipientId(Number(e.target.value))}
        placeholder="Friend user ID"
      />
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border p-4">
        {messages.length === 0 && <p className="text-center text-[var(--text-secondary)]">No messages yet</p>}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.sender_id === 1 ? "ml-auto bg-duo-green text-white dark:text-black" : "bg-[var(--border-color)] dark:text-black"}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded-2xl border-2 px-4 py-2 dark:text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          maxLength={500}
        />
        <button className="btn-primary" onClick={send}>Send</button>
      </div>
    </div>
  );
}
