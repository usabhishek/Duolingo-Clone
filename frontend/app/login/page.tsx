"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { setTokens } from "@/lib/auth/tokens";

export default function LoginPage() {
  const [email, setEmail] = useState("maria@linguaquest.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const tokens = await authApi.login(email, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/auth/oauth/google`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err.detail || "Failed to start Google OAuth");
      }
      const data = await res.json();
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google OAuth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 py-10 text-[var(--text-primary)]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-5xl font-black tracking-tight text-[#58CC02]">LinguaQuest</div>
          <p className="mt-2 text-lg text-[var(--text-secondary)]">Let&apos;s learn something exciting together.</p>
        </div>

        <form onSubmit={handleLogin} className="rounded-[28px] border-2 border-[var(--border-color)] bg-[var(--surface)] p-4 shadow-[0_16px_40px_rgba(18,28,35,0.18)]">
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#58CC02]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 pr-14 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#58CC02]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-[0.12em] text-[var(--text-secondary)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && <p className="text-sm font-bold text-[#ff8d8d]">{error}</p>}

            <button type="submit" className="w-full rounded-2xl bg-[#58CC02] px-6 py-3 text-lg font-black uppercase tracking-[0.12em] text-[#123028] shadow-[0_5px_0_#46A302] transition hover:translate-y-[1px] hover:shadow-none disabled:opacity-60" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          No account? <Link href="/register" className="font-black text-[#1cb0f6]">Sign up</Link>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] px-5 py-3 text-base font-black text-[var(--text-primary)] shadow-[0_10px_18px_rgba(0,0,0,0.12)] transition hover:bg-[var(--bg-secondary)] disabled:opacity-60"
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M21.8 10.23H21V10.2H12v3.6h5.3c-.23 1.34-1.23 2.48-2.63 3.15v2.6h4.25C20.57 18.2 22 14.6 22 12c0-.8-.1-1.33-.2-1.77z" fill="#4285F4"/>
            <path d="M12 22c2.7 0 4.97-.9 6.63-2.45l-4.25-2.6c-.95.64-2.15 1.02-3.38 1.02-2.6 0-4.8-1.77-5.59-4.16H2.98v2.6C4.63 19.9 8.02 22 12 22z" fill="#34A853"/>
            <path d="M6.41 13.81A6.99 6.99 0 016 12c0-.67.12-1.32.33-1.93V7.47H2.98A9.99 9.99 0 002 12c0 1.64.37 3.2 1.02 4.6l2.39-2.79z" fill="#FBBC05"/>
            <path d="M12 6.5c1.47 0 2.8.5 3.85 1.48l2.88-2.88C16.96 3.56 14.69 2.5 12 2.5 8.02 2.5 4.63 4.6 2.98 7.47l3.35 2.6C7.2 8.27 9.4 6.5 12 6.5z" fill="#EA4335"/>
          </svg>
          <span>{loading ? "Starting..." : "Sign in with Google"}</span>
        </button>
      </div>
    </div>
  );
}
