import React from "react";
import { chipPalette } from "../../theme/palette";
import { cn } from "../../utils/cn";

type ChipProps = {
  value: number;
  selected?: boolean;
  disabled?: boolean;
  size?: number;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">;

const DEFAULT_COLORS = { base: "#3a6b57", ring: "#325c4b", core: "#427c64", notch: "#2c5143" };

const formatChip = (value: number): string => {
  if (value >= 1000) {
    return `${value / 1000}K`;
  }
  return `${value}`;
};

const getChipColors = (value: number) => chipPalette[value] ?? DEFAULT_COLORS;

export const Chip: React.FC<ChipProps> = ({
  value,
  selected = false,
  disabled = false,
  onClick,
  size = 56,
  className,
  style,
  ...rest
}) => {
  const colors = getChipColors(value);
  const gradientId = React.useId();

  return (
    <button
      type="button"
      className={cn("chip", selected && "is-selected", disabled && "is-disabled", className)}
      style={{ width: size, height: size, ...style }}
      onClick={onClick}
      aria-pressed={selected}
      disabled={disabled}
      {...rest}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <radialGradient id={`${gradientId}-gloss`} cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill={colors.base} />
        <circle cx="50" cy="50" r="48" fill={`url(#${gradientId}-gloss)`} />
        <circle cx="50" cy="50" r="37" fill={colors.ring} />
        <circle cx="50" cy="50" r="31" fill={colors.core} />
        <g fill={colors.notch} opacity="0.9">
          {Array.from({ length: 6 }).map((_, index) => {
            const angle = (index * 360) / 6;
            const radians = (angle * Math.PI) / 180;
            const x = 50 + Math.cos(radians) * 43;
            const y = 50 + Math.sin(radians) * 43;
            return <circle key={angle} cx={x} cy={y} r="4" />;
          })}
        </g>
      </svg>
      <span className="chip-value">{formatChip(value)}</span>
    </button>
  );
};
