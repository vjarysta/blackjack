import * as React from "react";

const getPrefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = React.useState<boolean>(getPrefersReducedMotion);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = () => setPrefers(media.matches);
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return prefers;
}

export { getPrefersReducedMotion };
