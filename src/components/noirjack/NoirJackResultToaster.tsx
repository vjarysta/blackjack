import React from "react";
import { Toaster } from "sonner";
import { prefersReducedMotion } from "./ResultToast";

interface NoirJackResultToasterProps {
  isMobile: boolean;
}

const useReducedMotionPreference = (): boolean => {
  const [reduced, setReduced] = React.useState<boolean>(() => prefersReducedMotion());

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return reduced;
};

export const NoirJackResultToaster: React.FC<NoirJackResultToasterProps> = ({ isMobile }) => {
  const reduced = useReducedMotionPreference();
  const offset = isMobile
    ? { bottom: "calc(env(safe-area-inset-bottom) + 24px)" }
    : { top: 24 };

  return (
    <Toaster
      position={isMobile ? "bottom-center" : "top-center"}
      duration={reduced ? 1800 : 3000}
      visibleToasts={1}
      toastOptions={{
        className: "nj-toast-frame",
        closeButton: false,
        unstyled: true
      }}
      offset={offset}
    />
  );
};
