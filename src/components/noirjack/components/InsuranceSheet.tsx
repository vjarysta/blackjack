import * as React from "react";

interface InsuranceSheetProps {
  open: boolean;
  amount: number;
  onTake(): void;
  onSkip(): void;
}

export const InsuranceSheet: React.FC<InsuranceSheetProps> = ({
  open,
  amount,
  onTake,
  onSkip,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="nj-insurance" role="dialog" aria-modal="true" aria-label="Insurance decision">
      <div className="nj-insurance__sheet nj-glass">
        <h2>Insurance?</h2>
        <p>Take insurance for €{amount.toFixed(2)}?</p>
        <div className="nj-insurance__actions">
          <button type="button" className="nj-btn nj-btn-primary" onClick={onTake}>
            Take insurance
          </button>
          <button type="button" className="nj-btn nj-btn--ghost" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
