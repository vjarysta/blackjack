import * as React from "react";
import { cn } from "../../../utils/cn";

interface SettingsSheetProps {
  open: boolean;
  onClose(): void;
  sheetId: string;
  celebrationsEnabled: boolean;
  toggleCelebrations(): void;
  prefersReducedMotion: boolean;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  open,
  onClose,
  sheetId,
  celebrationsEnabled,
  toggleCelebrations,
  prefersReducedMotion,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="nj-settings"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${sheetId}-title`}
    >
      <button
        type="button"
        className="nj-settings__backdrop"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div className="nj-settings__panel nj-glass" id={sheetId}>
        <div className="nj-settings__header">
          <h2 id={`${sheetId}-title`}>Settings</h2>
          <button
            type="button"
            className="nj-settings__close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="nj-settings__section">
          <div className="nj-settings__row">
            <div className="nj-settings__info">
              <span className="nj-settings__label">Celebrations</span>
              <span className="nj-settings__description">
                Fireworks play when you win a round.
              </span>
              {prefersReducedMotion ? (
                <span className="nj-settings__note">
                  System reduced motion disables celebrations by default.
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className={cn(
                "nj-settings__toggle",
                celebrationsEnabled && "nj-settings__toggle--on"
              )}
              onClick={toggleCelebrations}
              aria-pressed={celebrationsEnabled}
            >
              <span>{celebrationsEnabled ? "On" : "Off"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
