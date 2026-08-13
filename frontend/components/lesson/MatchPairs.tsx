"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  left: string[];
  right: string[];
  onComplete: (pairs: Record<string, string>) => void;
  disabled?: boolean;
}

/** Interactive matching game */
export function MatchPairs({ left, right, onComplete, disabled }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [mismatch, setMismatch] = useState<string | null>(null);

  const matchedRights = new Set(Object.values(pairs));

  const selectRight = (r: string) => {
    if (disabled || !selectedLeft || matchedRights.has(r)) return;
    const newPairs = { ...pairs, [selectedLeft]: r };
    setPairs(newPairs);
    setSelectedLeft(null);
    if (Object.keys(newPairs).length === left.length) {
      onComplete(newPairs);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        {left.map((l) => (
          <button
            key={l}
            type="button"
            disabled={disabled || l in pairs}
            onClick={() => setSelectedLeft(l)}
            className={`card w-full text-left ${selectedLeft === l ? "border-duo-blue" : ""} ${l in pairs ? "opacity-50" : ""}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {right.map((r) => (
          <motion.button
            key={r}
            type="button"
            disabled={disabled || matchedRights.has(r)}
            onClick={() => selectRight(r)}
            animate={mismatch === r ? { x: [0, -5, 5, 0] } : {}}
            className={`card w-full text-left ${matchedRights.has(r) ? "border-duo-green opacity-50" : ""}`}
          >
            {r}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
