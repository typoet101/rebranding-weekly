"use client";

import { useEffect } from "react";

export type ToastTone = "success" | "error" | "info";

export default function Toast({
  message,
  tone = "success",
  onDone,
  duration = 1800,
}: {
  message: string;
  tone?: ToastTone;
  onDone: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  const palette =
    tone === "success"
      ? "bg-green-600 text-white"
      : tone === "error"
      ? "bg-red-600 text-white"
      : "bg-gray-800 text-white";

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-20 z-[60] pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className={`${palette} px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-fade-in-out`}
      >
        {message}
      </div>
    </div>
  );
}
