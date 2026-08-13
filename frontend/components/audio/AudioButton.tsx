"use client";

import { useState } from "react";

/** Free TTS via browser SpeechSynthesisUtterance — no paid API needed */
export function AudioButton({ text, language }: { text: string; language: string }) {
  const [playing, setPlaying] = useState(false);

  const play = () => {
    if (!window.speechSynthesis) return;
    setPlaying(true);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    utter.onend = () => setPlaying(false);
    window.speechSynthesis.speak(utter);
  };

  return (
    <button
      type="button"
      onClick={play}
      className={`flex items-center gap-2 rounded-2xl border-2 border-duo-blue px-4 py-2 font-bold text-duo-blue ${
        playing ? "animate-pulse" : ""
      }`}
    >
      🔊 {playing ? "Playing..." : "Listen"}
    </button>
  );
}
