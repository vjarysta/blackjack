import React from "react";
import type { RuleConfig } from "../engine/types";

interface RuleBadgesProps {
  rules: RuleConfig;
}

const describeSurrender = (value: RuleConfig["surrender"]): string => {
  switch (value) {
    case "early":
      return "Early surrender";
    case "late":
      return "Late surrender";
    default:
      return "Surrender unavailable";
  }
};

export const RuleBadges: React.FC<RuleBadgesProps> = ({ rules }) => {
  const tooltipId = React.useId();

  return (
    <div className="group relative inline-flex items-center justify-center">
      <button
        type="button"
        aria-describedby={tooltipId}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:rgba(233,196,106,0.45)] bg-[color:rgba(15,23,30,0.6)] text-xs font-semibold text-[color:var(--nj-gold,#e9c46a)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(233,196,106,0.65)] group-hover:text-white"
      >
        ℹ
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 hidden w-64 -translate-x-1/2 translate-y-3 rounded-xl border border-[color:rgba(233,196,106,0.35)] bg-[color:rgba(10,15,20,0.94)] px-4 py-3 text-[12px] leading-relaxed text-white/90 shadow-xl backdrop-blur group-hover:block group-focus-within:block"
        style={{ boxShadow: "0 18px 35px rgba(0,0,0,0.45)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--nj-text-muted,#d1d5db)]">Table rules</p>
        <dl className="mt-3 space-y-2">
          <div className="flex justify-between gap-3 text-white/90">
            <dt className="text-[color:var(--nj-text-muted,#9ca3af)]">Blackjack</dt>
            <dd className="font-semibold">Pays {rules.blackjackPayout}</dd>
          </div>
          <div className="flex justify-between gap-3 text-white/90">
            <dt className="text-[color:var(--nj-text-muted,#9ca3af)]">Dealer</dt>
            <dd className="font-semibold">
              {rules.dealerStandsOnSoft17 ? "Stands on soft 17" : "Hits soft 17"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 text-white/90">
            <dt className="text-[color:var(--nj-text-muted,#9ca3af)]">Double</dt>
            <dd className="font-semibold">{rules.doubleAfterSplit ? "Allowed after split" : "No DAS"}</dd>
          </div>
          <div className="flex justify-between gap-3 text-white/90">
            <dt className="text-[color:var(--nj-text-muted,#9ca3af)]">Surrender</dt>
            <dd className="font-semibold">{describeSurrender(rules.surrender)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-white/90">
            <dt className="text-[color:var(--nj-text-muted,#9ca3af)]">Insurance</dt>
            <dd className="font-semibold">{rules.allowInsurance ? "Offered vs ace" : "Not offered"}</dd>
          </div>
          <div className="flex justify-between gap-3 text-white/90">
            <dt className="text-[color:var(--nj-text-muted,#9ca3af)]">Peek</dt>
            <dd className="font-semibold">{rules.dealerPeekOnTenOrAce ? "Dealer peeks on 10/A" : "No peek"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
