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

export const chipPalette: Record<number, { base: string; ring: string; core: string; notch: string }> = {
  1: { base: "#f2f2ee", ring: "#e8e6db", core: "#fffdf6", notch: "#d2cfbf" },
  5: { base: "#d9534f", ring: "#c44b47", core: "#e76662", notch: "#b74440" },
  25: { base: "#2d6a4f", ring: "#265a43", core: "#338f68", notch: "#244f3c" },
  100: { base: "#303338", ring: "#282b2f", core: "#404349", notch: "#1f2125" },
  500: { base: "#5b3ea8", ring: "#4e3593", core: "#6b50ba", notch: "#462f87" }
};

export type ChipDenomination = keyof typeof chipPalette;
