import React from "react";
import { Crown, Equal, Sparkles, X, XCircle } from "lucide-react";
import { Toaster, toast } from "sonner";
import { formatCurrency } from "../../utils/currency";
import { cn } from "../../utils/cn";

export type ResultKind = "win" | "lose" | "push" | "blackjack";

type LucideIcon = (props: React.ComponentPropsWithoutRef<typeof Sparkles>) => JSX.Element;

type ToastEnvironment = {
  duration: number;
  isMobile: boolean;
  reducedMotion: boolean;
};

const DEFAULT_ENVIRONMENT: ToastEnvironment = {
  duration: 3200,
  isMobile: false,
  reducedMotion: false
};

let environment = DEFAULT_ENVIRONMENT;

const updateEnvironment = (next: Partial<ToastEnvironment>): void => {
  environment = { ...environment, ...next };
};

const ICONS: Record<ResultKind, LucideIcon> = {
  win: Sparkles,
  lose: XCircle,
  push: Equal,
  blackjack: Crown
};

const TITLES: Record<ResultKind, string> = {
  win: "YOU WIN",
  lose: "YOU LOSE",
  push: "PUSH",
  blackjack: "BLACKJACK!"
};

const SMALL_AMOUNT = 0.004;

const formatAmount = (value: number): string => {
  if (Number.isNaN(value)) {
    return formatCurrency(0);
  }
  const normalised = Math.abs(value) < SMALL_AMOUNT ? 0 : value;
  if (normalised > 0) {
    return `+${formatCurrency(normalised)}`;
  }
  if (normalised < 0) {
    return `-${formatCurrency(Math.abs(normalised))}`;
  }
  return formatCurrency(0);
};

const usePrefersReducedMotion = (): boolean => {
  const [prefers, setPrefers] = React.useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = () => setPrefers(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return prefers;
};

const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia("(max-width: 640px)").matches;
  });

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia("(max-width: 640px)");
    const listener = () => setIsMobile(media.matches);
    media.addEventListener("change", listener);
    listener();
    return () => media.removeEventListener("change", listener);
  }, []);

  return isMobile;
};

let lastToastId: string | null = null;
let lastShownAt = 0;

const computeToastId = (): string => {
  const now = Date.now();
  const reuse = lastToastId !== null && now - lastShownAt < 1000;
  const id = reuse ? lastToastId : `nj-result-${now}`;
  lastToastId = id;
  lastShownAt = now;
  return id;
};

const maybeVibrate = (kind: ResultKind): void => {
  if (!environment.isMobile || environment.reducedMotion) {
    return;
  }
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  if (kind === "push") {
    return;
  }
  if (kind === "lose") {
    navigator.vibrate(10);
    return;
  }
  navigator.vibrate(15);
};

const renderIcon = (kind: ResultKind): JSX.Element => {
  const Icon = ICONS[kind];
  return <Icon strokeWidth={1.5} aria-hidden="true" />;
};

// eslint-disable-next-line react-refresh/only-export-components
export const ResultToast = {
  show(kind: ResultKind, amountEUR: number, details?: string): void {
    if (typeof window === "undefined") {
      return;
    }
    const id = computeToastId();
    const title = TITLES[kind];
    const amountLabel = formatAmount(amountEUR);
    const detailText = details?.trim() ?? "";

    toast.custom(
      (toastId) => (
        <div className={cn("nj-result-toast", `nj-result-toast--${kind}`)} role="status" aria-live="polite">
          <div className="nj-result-toast__body">
            <span className="nj-result-toast__icon">{renderIcon(kind)}</span>
            <div className="nj-result-toast__text">
              <span className="nj-result-toast__title">{title}</span>
              <span className="nj-result-toast__subtitle">
                <span className="nj-result-toast__amount">{amountLabel}</span>
                {detailText ? <span className="nj-result-toast__details">{detailText}</span> : null}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="nj-result-toast__dismiss"
            onClick={() => toast.dismiss(toastId)}
          >
            <span className="sr-only">Close</span>
            <X strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      ),
      {
        id,
        duration: environment.duration
      }
    );

    maybeVibrate(kind);
  }
};

export const NoirJackToastProvider: React.FC = () => {
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const duration = prefersReducedMotion ? 1800 : 3200;

  React.useEffect(() => {
    updateEnvironment({
      isMobile,
      reducedMotion: prefersReducedMotion,
      duration
    });
  }, [isMobile, prefersReducedMotion, duration]);

  return (
    <Toaster
      position={isMobile ? "bottom-center" : "top-center"}
      visibleToasts={1}
      closeButton={false}
      toastOptions={{
        duration,
        className: "nj-toast-reset",
        style: { background: "transparent", boxShadow: "none", padding: 0 }
      }}
      theme="dark"
      offset={isMobile ? 28 : 20}
    />
  );
};
