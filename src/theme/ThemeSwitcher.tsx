import React from "react";
import { cn } from "../utils/cn";
import type { ThemeIdentity } from "./types";

interface ThemeSwitcherProps {
  themes: ThemeIdentity[];
  value: string;
  onChange: (themeId: string) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ themes, value, onChange }) => {
  if (themes.length <= 1) {
    return null;
  }

  return (
    <div className="inline-flex rounded-full border border-[rgba(216,182,76,0.3)] bg-black/20 p-1 text-[10px] uppercase tracking-[0.25em]">
      {themes.map((theme) => {
        const isActive = theme.id === value;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={cn(
              "relative min-w-[88px] cursor-pointer rounded-full px-4 py-1 font-semibold transition",
              isActive
                ? "bg-[rgba(216,182,76,0.18)] text-[var(--text-hi,rgba(243,239,227,1))] shadow-[inset_0_0_0_1px_rgba(216,182,76,0.4)]"
                : "text-[var(--text-lo,#a8b3a7)] hover:text-[var(--text-hi,rgba(243,239,227,1))]",
            )}
            aria-pressed={isActive}
          >
            {theme.label}
          </button>
        );
      })}
    </div>
  );
};
