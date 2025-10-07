import React from "react";
export type ResultTone = "win" | "lose" | "push";

interface ResultBannerProps {
  message: string;
  tone: ResultTone;
}

export const ResultBanner: React.FC<ResultBannerProps> = ({ message, tone }) => {
  const toneColor: Record<ResultTone, string> = {
    win: "var(--nj-win)",
    lose: "var(--nj-lose)",
    push: "var(--nj-gold)"
  };
  return (
    <div className="nj-result" role="status" aria-live="polite" style={{ color: toneColor[tone] }}>
      {message}
    </div>
  );
};
