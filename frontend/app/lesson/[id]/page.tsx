"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExerciseRenderer } from "@/components/lesson/ExerciseRenderer";
import { lessonsApi } from "@/lib/api";
import { getToken } from "@/lib/auth/tokens";
import type { CompleteLessonResponse, Exercise, StartLessonResponse } from "@/types";

/** Lesson player — exercise loop with hearts, feedback, completion */
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
    } catch {
      // Audio feedback is optional, and should not block the lesson flow.
    }
  };

  const handleSubmit = async (answer: unknown) => {
    if (!session || !currentExercise) return;
    const result = await lessonsApi.answer(token, session.attempt_id, currentExercise.id, answer);
    setHearts(result.hearts_remaining);
    setFeedback({ isCorrect: result.is_correct, message: result.feedback });
    setShowContinue(true);
    playSubmissionTone(result.is_correct);

    if (result.lesson_failed) {
      setTimeout(() => router.push("/"), 2000);
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

  if (loading) return <div className="py-20 text-center">Loading lesson...</div>;

  if (completed) {
    return (
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="space-y-6 py-10 text-center">
        <h1 className="text-3xl font-extrabold text-duo-green">Lesson Complete! 🎉</h1>
        <p className="text-xl font-bold">+{completed.xp_earned} XP</p>
        <p>Streak: 🔥 {completed.streak}</p>
        {completed.perfect_lesson && <p className="text-duo-yellow">Perfect lesson! ⭐</p>}
        {completed.newly_earned_achievements.map((a) => (
          <p key={a.title} className="text-duo-purple">🏆 {a.title}</p>
        ))}
        <button className="btn-primary" onClick={() => router.push("/")}>Continue</button>
      </motion.div>
    );
  }

  const progress = session ? ((currentIdx + (showContinue ? 1 : 0)) / session.exercises.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)] px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-2xl">✕</button>
          <div className="flex-1 mx-4 h-3 overflow-hidden rounded-full bg-[var(--border-color)]">
            <div className="h-full bg-duo-green transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-duo-red font-bold">❤️ {hearts}</span>
        </div>
      </div>

      <div className="px-4 py-6">
        {currentExercise && (
          <ExerciseRenderer
            exercise={currentExercise}
            onSubmit={handleSubmit}
            disabled={showContinue}
            feedback={feedback}
          />
        )}
      </div>

      <AnimatePresence>
        {showContinue && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className={`fixed bottom-0 left-0 right-0 p-4 ${
              feedback?.isCorrect ? "bg-duo-green" : "bg-duo-red"
            } text-white`}
          >
            <p className="mb-3 font-bold">{feedback?.message}</p>
            <button className="w-full rounded-2xl bg-white py-3 font-bold text-black" onClick={handleContinue}>
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
