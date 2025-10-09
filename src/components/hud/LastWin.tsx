import React from "react";
import { formatCurrency } from "../../utils/currency";

type LastWinProps = {
  amount: number;
};

export const LastWin: React.FC<LastWinProps> = ({ amount }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-emerald-200">
      <span className="hidden text-[10px] uppercase tracking-[0.4em] md:inline">
        Last win
      </span>
      <span className="font-mono font-medium text-emerald-100">
        {formatCurrency(amount)}
      </span>
    </div>
  );
};