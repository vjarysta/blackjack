import React from "react";
import { chipPalette, type ChipDenomination } from "../../theme/palette";

const DEFAULT_COLORS = { base: "#3a6b57", ring: "#325c4b", core: "#427c64", notch: "#2c5143" };

interface ChipSVGProps {
  value: ChipDenomination;
  size?: number;
  shadow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ChipSVG: React.FC<ChipSVGProps> = ({ value, size = 56, shadow = false, className, style }) => {
  const colors = chipPalette[value] ?? DEFAULT_COLORS;
  const gradientId = React.useId();
  const notchCount = 6;

  const textFill = value >= 100 ? "rgba(245,245,245,0.92)" : "rgba(0,0,0,0.82)";

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{
        filter: shadow ? "drop-shadow(0 6px 18px rgba(0,0,0,0.4))" : undefined,
        ...style
      }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${gradientId}-sheen`} cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={colors.base} />
      <circle cx="50" cy="50" r="48" fill={`url(#${gradientId}-sheen)`} />
      <circle cx="50" cy="50" r="37" fill={colors.ring} />
      <circle cx="50" cy="50" r="31" fill={colors.core} />
      <g fill={colors.notch} opacity="0.9">
        {Array.from({ length: notchCount }).map((_, index) => {
          const angle = (index * 360) / notchCount;
          const radians = (angle * Math.PI) / 180;
          const x = 50 + Math.cos(radians) * 43;
          const y = 50 + Math.sin(radians) * 43;
          return <circle key={angle} cx={x} cy={y} r="4" />;
        })}
      </g>
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="26"
        fontWeight="700"
        fill={textFill}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </text>
    </svg>
  );
};
