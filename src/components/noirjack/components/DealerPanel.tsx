import * as React from "react";
import type { Hand } from "../../../engine/types";
import { NoirCardFan } from "../NoirCardFan";

interface DealerPanelProps {
  cards: Hand["cards"];
  faceDownIndexes: number[];
  status: string;
  showInsuranceFooter: boolean;
}

export const DealerPanel: React.FC<DealerPanelProps> = ({
  cards,
  faceDownIndexes,
  status,
  showInsuranceFooter,
}) => (
  <section className="nj-section nj-section--dealer">
    <div className="nj-glass nj-panel">
      <div className="nj-panel__header">
        <span className="nj-panel__title">Dealer</span>
        <span className="nj-panel__subtitle">{status}</span>
      </div>
      <div className="nj-panel__cards">
        <NoirCardFan cards={cards} faceDownIndexes={faceDownIndexes} />
      </div>
      {showInsuranceFooter ? (
        <div className="nj-panel__footer">Insurance available</div>
      ) : null}
    </div>
  </section>
);
