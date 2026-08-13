"use client";

import { useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  language: string;
}

type SpeechRecognitionInstance = {
  lang: string;
  onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
};

/** Browser Speech Recognition with text fallback */
export function SpeechInput({ value, onChange, disabled, language }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const startListening = () => {
    const w = window as unknown as Record<string, new () => SpeechRecognitionInstance>;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = language;
    rec.onresult = (e) => {
      onChange(e.results[0][0].transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  if (!supported) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-duo-orange">Speech recognition is unavailable. Type your answer instead.</p>
        <input
          className="w-full rounded-2xl border-2 px-4 py-3"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <button
        type="button"
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl ${
          listening ? "animate-pulse bg-duo-red text-white" : "bg-duo-blue text-white"
        }`}
        onClick={startListening}
        disabled={disabled || listening}
      >
        🎤
      </button>
      <p className="text-sm text-[var(--text-secondary)]">
        {listening ? "Listening..." : "Tap to speak"}
      </p>
      {value && <p className="font-bold">You said: {value}</p>}
    </div>
  );
}
