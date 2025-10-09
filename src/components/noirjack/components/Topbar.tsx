import * as React from "react";
import { Info, Settings2 } from "lucide-react";
import type { CoachMode } from "../../../store/useGameStore";
import { NoirSoundControls } from "../NoirSoundControls";
import logoImage from "../../../assets/images/logo.png";
import { CoachModeSelector } from "./CoachModeSelector";

interface TopbarStat {
  label: string;
  value: React.ReactNode;
}

interface TopbarProps {
  coachMode: CoachMode;
  onCoachModeChange(mode: CoachMode): void;
  onOpenSettings(): void;
  settingsOpen: boolean;
  settingsSheetId: string;
  modeToggle: React.ReactNode;
  stats: TopbarStat[];
  error: string | null;
  onDismissError(): void;
}

export const Topbar: React.FC<TopbarProps> = ({
  coachMode,
  onCoachModeChange,
  onOpenSettings,
  settingsOpen,
  settingsSheetId,
  modeToggle,
  stats,
  error,
  onDismissError,
}) => {
  const errorBanner = error ? (
    <div className="nj-glass nj-error" role="alert">
      <span>{error}</span>
      <button
        type="button"
        className="nj-btn nj-btn--ghost"
        onClick={onDismissError}
      >
        Dismiss
      </button>
    </div>
  ) : null;

  return (
    <header className="nj-topbar">
      <div className="nj-topbar__brand">
        <img src={logoImage} alt="NoirJack logo" className="nj-logo" />
        <span className="sr-only">NoirJack Blackjack table</span>
        <div className="nj-topbar__controls">
          <button
            type="button"
            className="nj-btn nj-btn--ghost"
            aria-label="Table information"
          >
            <Info size={18} aria-hidden="true" />
          </button>
          <CoachModeSelector mode={coachMode} onChange={onCoachModeChange} />
          <NoirSoundControls />
          <button
            type="button"
            className="nj-btn nj-btn--ghost"
            aria-label="Table settings"
            onClick={onOpenSettings}
            aria-expanded={settingsOpen}
            aria-controls={settingsSheetId}
            aria-haspopup="dialog"
          >
            <Settings2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="nj-topbar__mode">{modeToggle}</div>
      <div className="nj-topbar__stats nj-glass">
        {stats.map((item) => (
          <div key={item.label} className="nj-stat">
            <span className="nj-stat__label">{item.label}</span>
            <span className="nj-stat__value">{item.value}</span>
          </div>
        ))}
      </div>
      {errorBanner}
    </header>
  );
};
