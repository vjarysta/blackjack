import React from "react";
import { Button } from "../components/ui/button";
import type { InterfaceMode } from "./interfaceMode";
import { cn } from "../utils/cn";

interface InterfaceModeToggleProps {
  mode: InterfaceMode;
  onChange: (mode: InterfaceMode) => void;
}

const options: { value: InterfaceMode; label: string }[] = [
  { value: "classic", label: "Classic UI" },
  { value: "mobile", label: "Mobile UI" }
];

export const InterfaceModeToggle: React.FC<InterfaceModeToggleProps> = ({ mode, onChange }) => (
  <div className="inline-flex items-center gap-1 rounded-full border border-[#c8a24a]/50 bg-[#0f3126]/80 p-1 text-xs shadow-[0_12px_28px_rgba(0,0,0,0.45)] backdrop-blur">
    {options.map((option) => {
      const isActive = option.value === mode;
      return (
        <Button
          key={option.value}
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.3em] transition",
            isActive
              ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              : "text-emerald-200 hover:bg-emerald-800/60"
          )}
          aria-pressed={isActive}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      );
    })}
  </div>
);
