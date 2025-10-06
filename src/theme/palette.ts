export const palette = {
  felt: {
    light: "#0f3d2e",
    dark: "#0b2d22"
  },
  feltHighlight: "#145941",
  line: "#eae9e1",
  gold: "#c8a24a",
  cardFace: "#f4f1e6",
  cardBorder: "#ded3c1",
  cardIndexBlack: "#1e1b18",
  cardIndexRed: "#c3494c",
  cardPipMuted: "#d9cec0",
  cardBack: "#0d3a3a",
  cardBackBorder: "#c8a24a",
  text: "#f6f5ef",
  subtleText: "#c7d1c9"
} as const;

export const chipPalette: Record<number, { base: string; accent: string; text: string }> = {
  1: { base: "#f5f5f2", accent: "#dad9d4", text: "#2f2f2f" },
  5: { base: "#d54848", accent: "#b63d3d", text: "#f9f4f4" },
  25: { base: "#2d6a4f", accent: "#24533d", text: "#f1f9f5" },
  100: { base: "#1d1d1d", accent: "#3a3a3a", text: "#f0f0f0" },
  500: { base: "#6a3ea1", accent: "#553281", text: "#f4eef9" }
};

export type ChipDenomination = keyof typeof chipPalette;
