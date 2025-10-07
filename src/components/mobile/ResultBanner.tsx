import React from "react";
import { cn } from "../../utils/cn";

export type ResultTone = "win" | "lose" | "push";

interface ResultBannerProps {
  message: string;
  tone: ResultTone;
}

const toneClasses: Record<ResultTone, string> = {
  win: "bg-emerald-600/80 border-emerald-300 text-emerald-50",
  lose: "bg-rose-700/80 border-rose-300/80 text-rose-50",
  push: "bg-amber-600/80 border-amber-300/80 text-amber-50"
};

export const ResultBanner: React.FC<ResultBannerProps> = ({ message, tone }) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-sm rounded-full border px-4 py-2 text-center text-sm font-semibold uppercase tracking-[0.32em] shadow",
        toneClasses[tone]
      )}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
};
