import { formatCurrency } from "../utils/currency";
import type { HandTotals } from "../engine/totals";

export const formatHandTotals = (totals: HandTotals): string => {
  if (totals.soft && totals.soft !== totals.hard) {
    return `${totals.soft} (soft)`;
  }
  return `${totals.hard}`;
};

export const formatBet = (amount: number): string => formatCurrency(amount);
