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
        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#c8a24a]/50 bg-[#0f3a2c]/70 text-xs font-semibold text-emerald-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a24a]/80 group-hover:text-emerald-100"
      >
        ℹ
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 hidden w-64 -translate-x-1/2 translate-y-3 rounded-xl border border-[#c8a24a]/40 bg-[#0b2a20]/95 px-4 py-3 text-[12px] leading-relaxed text-emerald-100 shadow-xl backdrop-blur group-hover:block group-focus-within:block"
        style={{ boxShadow: "0 18px 35px rgba(0,0,0,0.45)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-300">Table rules</p>
        <dl className="mt-3 space-y-2">
          <div className="flex justify-between gap-3">
            <dt className="text-emerald-300">Blackjack</dt>
            <dd className="font-semibold text-emerald-50">Pays {rules.blackjackPayout}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-emerald-300">Dealer</dt>
            <dd className="font-semibold text-emerald-50">
              {rules.dealerStandsOnSoft17 ? "Stands on soft 17" : "Hits soft 17"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-emerald-300">Double</dt>
            <dd className="font-semibold text-emerald-50">
              {rules.doubleAfterSplit ? "Allowed after split" : "No DAS"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-emerald-300">Surrender</dt>
            <dd className="font-semibold text-emerald-50">{describeSurrender(rules.surrender)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-emerald-300">Insurance</dt>
            <dd className="font-semibold text-emerald-50">
              {rules.allowInsurance ? "Offered vs ace" : "Not offered"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-emerald-300">Peek</dt>
            <dd className="font-semibold text-emerald-50">
              {rules.dealerPeekOnTenOrAce ? "Dealer peeks on 10/A" : "No peek"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
