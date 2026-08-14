"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExerciseRenderer } from "@/components/lesson/ExerciseRenderer";
import { lessonsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";
import type { CompleteLessonResponse, Exercise, StartLessonResponse } from "@/types";

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = getToken()!;

  const [session, setSession] = useState<StartLessonResponse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [showContinue, setShowContinue] = useState(false);
  const [completed, setCompleted] = useState<CompleteLessonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOutOfHeartsModal, setShowOutOfHeartsModal] = useState(false);

  useEffect(() => {
    lessonsApi.start(token, Number(id)).then((s) => {
      setSession(s);
      setHearts(s.hearts_remaining);
      setLoading(false);
    }).catch(() => router.push("/"));
  }, [id, token, router]);

  const currentExercise: Exercise | undefined = session?.exercises[currentIdx];

  const playSubmissionTone = (isCorrect: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = isCorrect ? "triangle" : "sawtooth";
      oscillator.frequency.value = isCorrect ? 660 : 220;
      gainNode.gain.value = 0.03;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.18);
      setTimeout(() => audioContext.close(), 220);
    } catch { /* Audio feedback is optional */ }
  };

  const handleSubmit = async (answer: unknown) => {
    if (!session || !currentExercise) return;
    const result = await lessonsApi.answer(token, session.attempt_id, currentExercise.id, answer);
    setHearts(result.hearts_remaining);
    setFeedback({ isCorrect: result.is_correct, message: result.feedback });
    setShowContinue(true);
    playSubmissionTone(result.is_correct);

    if (result.lesson_failed) {
      setShowOutOfHeartsModal(true);
      setTimeout(() => router.push("/"), 3000);
    }
  };

  const handleContinue = async () => {
    if (!session) return;
    const isLast = currentIdx >= session.exercises.length - 1;
    if (isLast) {
      const result = await lessonsApi.complete(token, session.attempt_id);
      setCompleted(result);
    } else {
      setCurrentIdx((i) => i + 1);
      setFeedback(null);
      setShowContinue(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#58CC02] border-t-transparent" />
          <p className="font-black text-[var(--text-secondary)]">Loading lesson...</p>
        </div>
      </div>
    );
  }

  /* ── Lesson Complete Screen ── */
  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md space-y-5 rounded-[32px] border-2 border-[#58CC02] bg-[var(--surface)] p-8 text-center shadow-[0_20px_60px_rgba(88,204,2,0.15)]"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="text-6xl"
          >
            🎉
          </motion.div>
          <h1 className="text-3xl font-black text-[#58CC02]">Lesson Complete!</h1>
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#edfde0] py-3 dark:bg-[#1d3d48]">
            <span className="text-2xl">⚡</span>
            <span className="text-2xl font-black text-[#58CC02]">+{completed.xp_earned} XP</span>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-black text-[var(--text-primary)]">🔥 {completed.streak}</p>
              <p className="text-[var(--text-secondary)]">Day Streak</p>
            </div>
            {completed.perfect_lesson && (
              <div className="text-center">
                <p className="text-2xl font-black text-[#FFC800]">⭐</p>
                <p className="text-[var(--text-secondary)]">Perfect!</p>
              </div>
            )}
          </div>

          {completed.newly_earned_achievements?.length > 0 && (
            <div className="space-y-2">
              {completed.newly_earned_achievements.map((a: { title: string }) => (
                <div key={a.title} className="flex items-center gap-2 rounded-xl bg-[#f5e8ff] px-4 py-2 dark:bg-[#2a1540]">
                  <span>🏆</span>
                  <span className="font-black text-[#CE82FF]">{a.title}</span>
                </div>
              ))}
            </div>
          )}

          <button
            className="w-full rounded-2xl bg-[#58CC02] py-4 font-black uppercase tracking-wider text-white shadow-[0_4px_0_#46A302] transition hover:translate-y-px hover:shadow-none"
            onClick={() => router.push("/")}
          >
            Continue
          </button>
        </motion.div>
      </div>
    );
  }

  const progress = session
    ? ((currentIdx + (showContinue ? 1 : 0)) / session.exercises.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--border-color)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)]"
          >
            ✕
          </button>
          <div className="flex-1 overflow-hidden rounded-full bg-[var(--border-color)] h-4">
            <motion.div
              className="h-full rounded-full bg-[#58CC02]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex items-center gap-1 font-black text-[#FF4B4B]">
            <span>❤️</span>
            <span>{hearts}</span>
          </div>
        </div>
      </div>

      {/* Exercise area */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        {currentExercise && (
          <ExerciseRenderer
            exercise={currentExercise}
            onSubmit={handleSubmit}
            disabled={showContinue}
            feedback={feedback}
          />
        )}
      </div>

      {/* Feedback bar */}
      <AnimatePresence>
        {showContinue && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed bottom-0 left-0 right-0 border-t-4 p-4 ${
              feedback?.isCorrect
                ? "border-[#46A302] bg-[#58CC02]"
                : "border-[#cc3d3d] bg-[#FF4B4B]"
            }`}
          >
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
              <div>
                <p className="font-black text-white">
                  {feedback?.isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                </p>
                <p className="text-sm text-white/90">{feedback?.message}</p>
              </div>
              <button
                className="rounded-2xl bg-white px-8 py-3 font-black text-black shadow-[0_4px_0_rgba(0,0,0,0.2)] transition hover:translate-y-px hover:shadow-none"
                onClick={handleContinue}
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Out of hearts modal */}
      <AnimatePresence>
        {showOutOfHeartsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-full max-w-sm rounded-[28px] bg-[var(--surface)] p-8 text-center"
            >
              <p className="text-5xl">💔</p>
              <h2 className="mt-4 text-2xl font-black text-[var(--text-primary)]">Out of Hearts!</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                You ran out of hearts. Returning to home...
              </p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--bg-primary)]">
                <motion.div
                  className="h-full bg-[#FF4B4B]"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
