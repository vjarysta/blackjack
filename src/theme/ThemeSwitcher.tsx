import React from "react";
import { themes } from "./registry";

interface ThemeSwitcherProps {
  currentTheme: string;
  onChange: (id: string) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onChange }) => {
  const allThemes = themes.all();

  if (allThemes.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-300">
      <span>Theme</span>
      <div className="flex gap-2">
        {allThemes.map((theme) => {
          const active = theme.id === currentTheme;
          return (
            <button
              key={theme.id}
              type="button"
              className={`h-9 rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.3em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                  ? "bg-[var(--accent,#c8a24a)] text-slate-900"
                  : "bg-transparent text-current border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.08)]"
              }`}
              onClick={() => onChange(theme.id)}
              aria-pressed={active}
            >
              {theme.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
