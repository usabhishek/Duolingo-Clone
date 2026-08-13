/** Course, path, and lesson APIs */
import { apiFetch } from "./client";
import type { AnswerResponse, CompleteLessonResponse, Course, PathResponse, StartLessonResponse } from "@/types";

export const coursesApi = {
  list: (token: string) => apiFetch<Course[]>("/api/v1/courses", {}, token),
  path: (token: string, courseId?: number) =>
    apiFetch<PathResponse>(`/api/v1/path${courseId ? `?course_id=${courseId}` : ""}`, {}, token),
  setActiveCourse: (token: string, courseId: number) =>
    apiFetch("/api/v1/users/active-course", { method: "POST", body: JSON.stringify({ course_id: courseId }) }, token),
};

export const lessonsApi = {
  start: (token: string, lessonId: number) =>
    apiFetch<StartLessonResponse>(`/api/v1/lessons/${lessonId}/attempts`, { method: "POST" }, token),
  answer: (token: string, attemptId: number, exerciseId: number, userAnswer: unknown) =>
    apiFetch<AnswerResponse>(
      `/api/v1/lesson-attempts/${attemptId}/answer`,
      { method: "POST", body: JSON.stringify({ exercise_id: exerciseId, user_answer: userAnswer }) },
      token
    ),
  complete: (token: string, attemptId: number) =>
    apiFetch<CompleteLessonResponse>(`/api/v1/lesson-attempts/${attemptId}/complete`, { method: "POST" }, token),
};

export const gamificationApi = {
  stats: (token: string) => apiFetch<{ current_streak: number; total_xp: number; hearts: number; gems: number; today_xp: number; daily_xp_goal: number }>("/api/v1/stats", {}, token),
  refillHearts: (token: string) => apiFetch<{ hearts: number; gems: number }>("/api/v1/hearts/refill", { method: "POST" }, token),
};

export const leaderboardApi = {
  get: (token: string) => apiFetch<{ entries: Array<{ rank: number; username: string; display_name: string; avatar_url: string; total_xp: number; is_current_user: boolean }>; current_user_rank: number }>("/api/v1/leaderboard", {}, token),
};

export const achievementsApi = {
  list: (token: string) => apiFetch<Array<{ id: number; title: string; description: string; unlocked: boolean; gem_reward: number; icon: string }>>("/api/v1/achievements", {}, token),
};

export const analyticsApi = {
  get: (token: string) => apiFetch<{ total_exercises: number; accuracy: number; strongest_exercise_type: string; weakest_exercise_type: string; weakest_skill: string | null }>("/api/v1/analytics", {}, token),
  learningHealth: (token: string) => apiFetch<{ score: number; category: string; explanation: string }>("/api/v1/analytics/learning-health", {}, token),
  recommendations: (token: string) => apiFetch<{ recommended_skill?: { id: number; title: string }; reason?: string; weakness_score?: number }>("/api/v1/recommendations", {}, token),
  mistakes: (token: string) => apiFetch<Array<{ exercise_id: number; prompt: string; user_answer: unknown; correct_answer: unknown; mistake_count: number; exercise_type: string; last_mistake_at: string }>>("/api/v1/mistakes", {}, token),
};

export const friendsApi = {
  list: (token: string) => apiFetch<Array<{ id: number; username: string; avatar_url: string; display_name: string }>>("/api/v1/friends", {}, token),
  pending: (token: string) => apiFetch<Array<{ friendship_id: number; user: { username: string; avatar_url: string } }>>("/api/v1/friends/pending", {}, token),
  request: (token: string, userId: number) =>
    apiFetch("/api/v1/friends/request", { method: "POST", body: JSON.stringify({ user_id: userId }) }, token),
  accept: (token: string, id: number) => apiFetch(`/api/v1/friends/${id}/accept`, { method: "POST" }, token),
  activity: (token: string) => apiFetch<Array<{ message: string; user: string; activity_type: string }>>("/api/v1/friends/activity", {}, token),
};

export const practiceApi = {
  personalized: (token: string) => apiFetch<{ session_id: number; exercises: import("@/types").Exercise[]; max_xp: number }>("/api/v1/practice/personalized", { method: "POST" }, token),
};
