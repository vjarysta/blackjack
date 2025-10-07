import React from "react";

export type ResultTone = "win" | "lose" | "push";

interface ResultBannerProps {
  message: string;
  tone: ResultTone;
}

export const ResultBanner: React.FC<ResultBannerProps> = ({ message, tone }) => {
  return (
    <div className="nj-result-banner" data-tone={tone} role="status" aria-live="polite">
      {message}
    </div>
  );
};
