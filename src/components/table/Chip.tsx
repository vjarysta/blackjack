import React from "react";
import type { ChipDenomination } from "../../theme/palette";
import { getChipColor } from "../../theme/palette";
import { cn } from "../../utils/cn";

interface ChipGraphicProps {
  value: ChipDenomination;
  size?: number;
  shadow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const useStableId = (value: ChipDenomination): string => {
  const reactId = React.useId();
  return `${reactId}-chip-${value}`;
};

export const ChipGraphic: React.FC<ChipGraphicProps> = ({
  value,
  size = 56,
  shadow = false,
  className,
  style
}) => {
  const colors = getChipColor(Number(value));
  const gradientId = useStableId(value);
  const mergedStyle = React.useMemo<React.CSSProperties>(
    () => ({
      filter: shadow ? "drop-shadow(0 6px 18px rgba(0,0,0,0.35))" : undefined,
      ...style
    }),
    [shadow, style]
  );

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={mergedStyle}
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id={`${gradientId}-gloss`} cx="50%" cy="45%">
          <stop offset="0%" stopColor="white" stopOpacity="0.06" />
          <stop offset="100%" stopColor="black" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={colors.base} />
      <circle cx="50" cy="50" r="48" fill={`url(#${gradientId}-gloss)`} />
      <circle cx="50" cy="50" r="36" fill={colors.ring} />
      <circle cx="50" cy="50" r="30" fill={colors.core} />
      <g fill={colors.notch} opacity="0.9">
        {Array.from({ length: 6 }).map((_, index) => {
          const angle = (index * 60 * Math.PI) / 180;
          const x = 50 + Math.cos(angle) * 43;
          const y = 50 + Math.sin(angle) * 43;
          return <circle key={index} cx={x} cy={y} r="4" />;
        })}
      </g>
    </svg>
  );
};

const formatChip = (value: number): string => {
  if (value >= 1000) {
    return `${value / 1000}K`;
  }
  return value.toString();
};

type ChipProps = {
  value: ChipDenomination;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: number;
  testId?: string;
};

export const Chip: React.FC<ChipProps> = ({
  value,
  selected = false,
  disabled = false,
  onClick,
  size = 56,
  testId
}) => {
  const label = `${Number(value)} chip`;
  return (
    <button
      type="button"
      data-testid={testId}
      className={cn("chip", selected && "is-selected", disabled && "is-disabled")}
      style={{ width: size, height: size }}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      disabled={disabled}
    >
      <ChipGraphic value={value} size={size} shadow={selected} />
      <span className="chip-value">{formatChip(Number(value))}</span>
    </button>
  );
};
