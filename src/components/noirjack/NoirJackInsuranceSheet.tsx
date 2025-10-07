import React from "react";
import { formatCurrency } from "../../utils/currency";

interface NoirJackInsuranceSheetProps {
  open: boolean;
  amount: number;
  onTake: () => void;
  onSkip: () => void;
}

export const NoirJackInsuranceSheet: React.FC<NoirJackInsuranceSheetProps> = ({ open, amount, onTake, onSkip }) => {
  const [visible, setVisible] = React.useState(open);
  const [state, setState] = React.useState<"enter" | "exit" | null>(open ? "enter" : null);

  React.useEffect(() => {
    if (open) {
      setVisible(true);
      setState("enter");
      return;
    }
    if (!open && visible) {
      setState("exit");
      const timeout = window.setTimeout(() => {
        setVisible(false);
        setState(null);
      }, 250);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [open, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm">
      <div className="nj-bottom-sheet w-full max-w-md" data-state={state ?? undefined}>
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--nj-text-muted)]">Insurance Offer</p>
        <h2 className="mt-2 text-lg font-semibold tracking-[0.08em]">
          Dealer shows Ace — insure {formatCurrency(amount)}?
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" className="nj-btn nj-btn-primary" onClick={onTake}>
            Take Insurance
          </button>
          <button type="button" className="nj-btn nj-btn-secondary" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
