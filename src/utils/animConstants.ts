export const ANIM = {
  deal: { duration: 0.35, ease: "easeOut" as const },
  flip: { duration: 0.3, ease: "easeInOut" as const },
  chip: { duration: 0.2, ease: "easeOut" as const },
  fade: { duration: 0.15, ease: "easeInOut" as const }
};
export const DEAL_STAGGER = 0.1;
export const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
