import React from "react";
import { Crown, Equal, Sparkles, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../utils/cn";

export type ResultKind = "win" | "lose" | "push" | "blackjack";

const currencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const titles: Record<ResultKind, string> = {
  win: "YOU WIN",
  lose: "YOU LOSE",
  push: "PUSH",
  blackjack: "BLACKJACK!"
};

const icons: Record<ResultKind, React.ReactNode> = {
  win: <Crown strokeWidth={1.6} aria-hidden="true" />,
  lose: <XCircle strokeWidth={1.6} aria-hidden="true" />,
  push: <Equal strokeWidth={1.6} aria-hidden="true" />,
  blackjack: <Sparkles strokeWidth={1.6} aria-hidden="true" />
};

const vibrationMap: Partial<Record<ResultKind, number>> = {
  win: 15,
  blackjack: 15,
  lose: 10
};

const formatSignedCurrency = (amount: number): string => {
  const absolute = Math.abs(amount);
  const formatted = currencyFormatter.format(absolute);
  if (amount > 0) {
    return `+${formatted}`;
  }
  if (amount < 0) {
    return `-${formatted}`;
  }
  return formatted;
};

const getPrefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const durationForToast = (): number => (getPrefersReducedMotion() ? 1800 : 3000);

const toastId = "noirjack-result";

export const ResultToast = {
  show(kind: ResultKind, amountEUR: number, details?: string): void {
    const duration = durationForToast();
    const amountLabel = formatSignedCurrency(amountEUR);
    const icon = icons[kind];
    const title = titles[kind];
    const accentClass = `nj-toast-card--${kind}`;

    toast.custom(
      (id) => (
        <div
          className={cn("nj-toast-card", accentClass)}
          role="status"
          aria-live="polite"
          data-kind={kind}
        >
          <div className="nj-toast-card__icon" aria-hidden="true">
            {icon}
          </div>
          <div className="nj-toast-card__content">
            <p className="nj-toast-card__title">{title}</p>
            <div className="nj-toast-card__text">
              <span className="nj-toast-card__amount">{amountLabel}</span>
              {details ? <span className="nj-toast-card__details">{details}</span> : null}
            </div>
          </div>
          <button
            type="button"
            className="nj-toast-card__close"
            onClick={() => toast.dismiss(id)}
            aria-label="Dismiss result notification"
          >
            <X strokeWidth={1.4} aria-hidden="true" />
          </button>
        </div>
      ),
      {
        id: toastId,
        duration,
        className: "nj-toast-frame",
        closeButton: false
      }
    );

    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const pattern = vibrationMap[kind];
      if (pattern && typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
      }
    }
  }
};

export const prefersReducedMotion = getPrefersReducedMotion;
