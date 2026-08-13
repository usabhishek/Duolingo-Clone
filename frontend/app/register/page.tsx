"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { setTokens } from "@/lib/auth/tokens";

const FIELDS = [
  { key: "display_name", label: "Display Name", type: "text", placeholder: "Your display name" },
  { key: "username", label: "Username", type: "text", placeholder: "Pick a username" },
  { key: "email", label: "Email", type: "email", placeholder: "Your email address" },
  { key: "password", label: "Password", type: "password", placeholder: "Create a password" },
] as const;

type FormKey = "display_name" | "username" | "email" | "password";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<FormKey, string>>({
    email: "",
    username: "",
    password: "",
    display_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const tokens = await authApi.register(form);
      setTokens(tokens.access_token, tokens.refresh_token);
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-5xl font-black tracking-tight text-[#58CC02]">LinguaQuest</div>
          <p className="mt-2 text-lg text-[var(--text-secondary)]">Create your free account</p>
        </div>

        <form
          onSubmit={handleRegister}
          className="rounded-[28px] border-2 border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-[0_16px_40px_rgba(18,28,35,0.12)]"
        >
          <h1 className="mb-5 text-xl font-black text-[var(--text-primary)]">Sign Up</h1>

          <div className="space-y-3">
            {FIELDS.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-[var(--text-secondary)]">
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  className="w-full rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#58CC02]"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required
                />
              </div>
            ))}

            {error && (
              <div className="rounded-xl bg-[#fde4e4] px-4 py-3 text-sm font-bold text-[#c0392b] dark:bg-[#2d1515] dark:text-[#ff8d8d]">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full rounded-2xl bg-[#58CC02] px-6 py-3 text-lg font-black uppercase tracking-[0.12em] text-white shadow-[0_5px_0_#46A302] transition hover:translate-y-px hover:shadow-none disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="font-black text-[#1CB0F6]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
