import React from "react";
import { chipPalette, type ChipDenomination } from "../../theme/palette";

interface ChipSVGProps {
  value: ChipDenomination;
  size?: number;
  shadow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ChipSVG: React.FC<ChipSVGProps> = ({ value, size = 56, shadow = false, className, style }) => {
  const colors = chipPalette[value];
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{
        filter: shadow ? "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" : undefined,
        ...style
      }}
    >
      <defs>
        <linearGradient id={`chip-base-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.base} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#chip-base-${value})`} stroke={colors.accent} strokeWidth="2" />
      <circle cx="50" cy="50" r="34" fill={colors.base} stroke={colors.accent} strokeWidth="3" />
      {Array.from({ length: 8 }).map((_, index) => {
        const angle = (index * Math.PI) / 4;
        const x1 = 50 + Math.cos(angle) * 40;
        const y1 = 50 + Math.sin(angle) * 40;
        const x2 = 50 + Math.cos(angle) * 48;
        const y2 = 50 + Math.sin(angle) * 48;
        return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.accent} strokeWidth={4} strokeLinecap="round" />;
      })}
      <text x="50" y="58" fill={colors.text} fontSize="28" fontWeight="700" textAnchor="middle">
        {value}
      </text>
    </svg>
  );
};
