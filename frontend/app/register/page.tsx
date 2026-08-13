"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { setTokens } from "@/lib/auth/tokens";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", password: "", display_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleRegister} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-extrabold">Create Account</h1>
        {(["display_name", "username", "email", "password"] as const).map((field) => (
          <input
            key={field}
            type={field === "password" ? "password" : field === "email" ? "email" : "text"}
            placeholder={field.replace("_", " ")}
            className="w-full rounded-xl border-2 px-4 py-3 capitalize"
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            required
          />
        ))}
        {error && <p className="text-sm text-duo-red">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>Sign Up</button>
        <p className="text-center text-sm">
          Have an account? <Link href="/login" className="font-bold text-duo-blue">Log in</Link>
        </p>
      </form>
    </div>
  );
}
