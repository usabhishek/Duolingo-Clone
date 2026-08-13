/** Shared TypeScript types matching FastAPI schemas */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  active_course_id: number | null;
  total_xp: number;
  gems: number;
  hearts: number;
  max_hearts: number;
  current_streak: number;
  longest_streak: number;
  daily_xp_goal: number;
  today_xp: number;
  lessons_completed: number;
}

export interface Course {
  id: number;
  slug: string;
  title: string;
  language_code: string;
  description: string;
  color: string;
  icon: string;
}

export interface Lesson {
  id: number;
  title: string;
  order: number;
  xp_reward: number;
  is_locked: boolean;
  is_completed: boolean;
}

export interface Skill {
  id: number;
  title: string;
  description: string;
  order: number;
  icon: string;
  crown_level: number;
  max_crowns: number;
  state: "locked" | "available" | "completed";
  lessons: Lesson[];
}

export interface Unit {
  id: number;
  title: string;
  description: string;
  order: number;
  color: string;
  skills: Skill[];
}

export interface PathResponse {
  course: Course;
  units: Unit[];
}

export interface Exercise {
  id: number;
  order: number;
  type: string;
  prompt: string;
  payload: Record<string, unknown>;
  audio_text?: string;
  language: string;
}

export interface StartLessonResponse {
  attempt_id: number;
  lesson_id: number;
  exercises: Exercise[];
  hearts_remaining: number;
  total_exercises: number;
}

export interface AnswerResponse {
  is_correct: boolean;
  correct_answer: unknown;
  hearts_remaining: number;
  lesson_failed: boolean;
  feedback: string;
  exercises_remaining: number;
}

export interface CompleteLessonResponse {
  xp_earned: number;
  total_xp: number;
  gems_earned: number;
  crown_level: number;
  streak: number;
  perfect_lesson: boolean;
  newly_earned_achievements: Array<{ title: string; icon: string }>;
  daily_goal: { goal: number; today_xp: number; met: boolean };
}
