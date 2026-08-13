"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Skill, Unit } from "@/types";

/** Duolingo-inspired vertical learning path */
export function LearningPath({ units }: { units: Unit[] }) {
  return (
    <div className="space-y-8">
      {units.map((unit) => (
        <section key={unit.id} className="relative">
          <div
            className="mb-5 rounded-[24px] px-4 py-3 text-white shadow-[0_14px_28px_rgba(0,0,0,0.18)]"
            style={{ background: `linear-gradient(135deg, ${unit.color}, ${unit.color}dd)` }}
          >
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Section 1</div>
            <h2 className="mt-1 text-2xl font-black">{unit.title}</h2>
            <p className="text-sm text-white/80">{unit.description}</p>
          </div>

          <div className="relative mx-auto w-full max-w-[420px] overflow-hidden px-2">
            <div className="absolute bottom-4 left-1/2 top-4 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#58CC02] via-[#7cd3ff] to-[var(--border-color)] opacity-90" />
            <div className="relative flex flex-col items-center gap-7">
              {unit.skills.map((skill, idx) => (
                <div key={skill.id} className="w-full flex justify-center">
                  <SkillNode skill={skill} index={idx} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function SkillNode({ skill, index }: { skill: Skill; index: number }) {
  const isLocked = skill.state === "locked";
  const isCompleted = skill.state === "completed";
  const firstLesson = skill.lessons.find((l) => !l.is_locked);

  const node = (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 16 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 20 }}
      className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[5px] border-b-[8px] text-2xl shadow-[0_12px_20px_rgba(0,0,0,0.18)] ${
        isLocked
          ? "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
          : isCompleted
          ? "border-[#84d46b] bg-[#58CC02] text-white"
          : "cursor-pointer border-[#4aa75d] bg-[#58CC02] text-white hover:scale-105"
      }`}
    >
      <span aria-hidden>{isLocked ? "🔒" : isCompleted ? "👑" : "⭐"}</span>
      {skill.crown_level > 0 && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#ffcc00] px-2 text-[10px] font-black text-black shadow-sm">
          {skill.crown_level}
        </span>
      )}
    </motion.div>
  );

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative z-10">
        {isLocked || !firstLesson ? (
          node
        ) : (
          <Link href={`/lesson/${firstLesson.id}`}>{node}</Link>
        )}
      </div>

      {/* Fixed: was text-white, invisible on light backgrounds */}
      <p className="max-w-[140px] text-center text-sm font-black text-[var(--text-primary)]">{skill.title}</p>

      <div className="flex gap-1">
        {skill.lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={lesson.is_locked ? "#" : `/lesson/${lesson.id}`}
            className={`h-3 w-3 rounded-full border border-[var(--border-color)] shadow-sm ${
              lesson.is_completed ? "bg-[#58CC02]" : lesson.is_locked ? "bg-[var(--border-color)]" : "bg-[#1CB0F6]"
            }`}
            title={lesson.title}
            aria-label={lesson.title}
          />
        ))}
      </div>
    </div>
  );
}
