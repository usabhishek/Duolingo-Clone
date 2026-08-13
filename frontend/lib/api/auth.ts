/** Auth API — register, login, current user */
import { apiFetch, apiForm } from "./client";
import type { TokenResponse, UserProfile } from "@/types";

export const authApi = {
  register: (data: { email: string; username: string; password: string; display_name: string }) =>
    apiFetch<TokenResponse>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    apiForm<TokenResponse>("/api/v1/auth/login", { username: email, password }),

  me: (token: string) => apiFetch<UserProfile>("/api/v1/auth/me", {}, token),
};
