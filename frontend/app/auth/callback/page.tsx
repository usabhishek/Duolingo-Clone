"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setTokens } from "@/lib/auth/tokens";

export default function OAuthCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    const state = params.get("state");
    if (access && refresh) {
      setTokens(access, refresh);
      window.location.assign(state || "/");
    } else {
      window.location.assign("/login");
    }
  }, [router]);

  return <div className="flex min-h-screen items-center justify-center">Signing in...</div>;
}
