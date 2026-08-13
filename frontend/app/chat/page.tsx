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
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "message", recipient_id: recipientId, content: input }));
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-3 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-[var(--text-primary)]">Chat 💬</h1>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
            connected
              ? "bg-[#edfde0] text-[#2d7a00] dark:bg-[#1d3d48] dark:text-[#8ae9b6]"
              : "bg-[#fde4e4] text-[#c0392b] dark:bg-[#2d1515] dark:text-[#ff8d8d]"
          }`}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-[#58CC02]" : "bg-[#FF4B4B]"}`} />
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Recipient input */}
      <div className="flex items-center gap-2 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] px-4 py-2">
        <label className="text-xs font-black uppercase tracking-wide text-[var(--text-secondary)] whitespace-nowrap">
          Friend ID
        </label>
        <input
          type="number"
          className="flex-1 bg-transparent text-sm font-bold text-[var(--text-primary)] outline-none"
          value={recipientId}
          onChange={(e) => setRecipientId(Number(e.target.value))}
          placeholder="Enter friend user ID"
        />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-[var(--text-secondary)]">
              No messages yet.<br />Say hello! 👋
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.sender_id === 1 ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm font-bold ${
                    m.sender_id === 1
                      ? "bg-[#58CC02] text-white"
                      : "bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#58CC02]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          maxLength={500}
        />
        <button
          className="rounded-2xl bg-[#58CC02] px-5 py-3 font-black text-white shadow-[0_4px_0_#46A302] transition hover:translate-y-px hover:shadow-none disabled:opacity-50"
          onClick={send}
          disabled={!input.trim() || !connected}
        >
          Send
        </button>
      </div>
    </div>
  );
}
