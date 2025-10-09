import * as React from "react";
import { getPrefersReducedMotion } from "./usePrefersReducedMotion";

const CELEBRATIONS_STORAGE_KEY = "noirjack.celebrations";

const readCelebrationsPreference = (): boolean | null => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(CELEBRATIONS_STORAGE_KEY);
    if (stored === null) {
      return null;
    }
    return stored === "true";
  } catch {
    return null;
  }
};

const persistCelebrationsPreference = (enabled: boolean): void => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      CELEBRATIONS_STORAGE_KEY,
      enabled ? "true" : "false"
    );
  } catch {
    // ignore persistence errors
  }
};

interface CelebrationPreference {
  enabled: boolean;
  setEnabled(next: boolean): void;
  toggle(): void;
  hasStoredPreference: boolean;
}

export function useCelebrationPreference(
  prefersReducedMotion: boolean
): CelebrationPreference {
  const initialStored = React.useMemo(() => readCelebrationsPreference(), []);
  const [hasStoredPreference, setHasStoredPreference] = React.useState<boolean>(
    initialStored !== null
  );
  const [enabled, setEnabledState] = React.useState<boolean>(() => {
    if (initialStored !== null) {
      return initialStored;
    }
    const systemPrefersReduced = getPrefersReducedMotion();
    return systemPrefersReduced ? false : true;
  });

  const setEnabled = React.useCallback((next: boolean) => {
    setEnabledState(next);
    persistCelebrationsPreference(next);
    setHasStoredPreference(true);
  }, []);

  const toggle = React.useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handler = (event: StorageEvent) => {
      if (
        event.key !== CELEBRATIONS_STORAGE_KEY ||
        event.storageArea !== window.localStorage
      ) {
        return;
      }
      if (event.newValue === null) {
        setHasStoredPreference(false);
        setEnabledState(prefersReducedMotion ? false : true);
        return;
      }
      setHasStoredPreference(true);
      setEnabledState(event.newValue === "true");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [prefersReducedMotion]);

  React.useEffect(() => {
    if (hasStoredPreference) {
      return;
    }
    const desired = prefersReducedMotion ? false : true;
    setEnabledState((current) => (current === desired ? current : desired));
  }, [hasStoredPreference, prefersReducedMotion]);

  return { enabled, setEnabled, toggle, hasStoredPreference };
}
