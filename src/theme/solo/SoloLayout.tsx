import React from "react";
import { canDouble, canHit, canSplit, canSurrender } from "../../engine/rules";
import type { Hand, Phase, RuleConfig, Seat } from "../../engine/types";
import { cn } from "../../utils/cn";
import type { ChipDenomination } from "../../theme/palette";
import { ThemeSwitcher } from "../ThemeSwitcher";
import type { ThemeLayoutProps } from "../types";
import { SoloHUD } from "./SoloHUD";
import { DealerArea } from "./DealerArea";
import { PlayerArea } from "./PlayerArea";
import { BetChipsBar } from "./BetChipsBar";
import { ActionBar, type SoloAction, type SoloActionAvailability } from "./ActionBar";
import { InsuranceStrip } from "./InsuranceStrip";
import { StatsDrawer } from "./StatsDrawer";
import { ToastHost, type ToastMessage } from "./Toast";
import "./solo.css";

const PLAYER_SEAT_INDEX = 0;
const CHIP_SET: ChipDenomination[] = [1, 5, 25, 100, 500];

const defaultAvailability: SoloActionAvailability = {
  deal: false,
  clear: false,
  rebet: false,
  hit: false,
  stand: false,
  double: false,
  split: false,
  surrender: false,
  playDealer: false,
  nextRound: false,
};

const classifyToast = (message: string): ToastMessage["tone"] => {
  const text = message.toLowerCase();
  if (text.includes("win") || text.includes("blackjack") || text.includes("pays")) {
    return "success";
  }
  if (text.includes("lose") || text.includes("bust") || text.includes("surrender")) {
    return "danger";
  }
  return "neutral";
};

const ensureChipArray = (seat: Seat | undefined): number[] => {
  if (!seat) {
    return [];
  }
  return Array.isArray(seat.chips) ? seat.chips : [];
};

const getPlayerSeat = (seats: Seat[]): Seat | undefined => seats[PLAYER_SEAT_INDEX];

const getActiveHand = (seat: Seat | undefined, activeHandId: string | null): Hand | undefined => {
  if (!seat || !activeHandId) {
    return undefined;
  }
  return seat.hands.find((hand) => hand.id === activeHandId);
};

const computeAvailability = (
  phase: Phase,
  seat: Seat | undefined,
  activeHand: Hand | undefined,
  bankroll: number,
  lastBet: number,
  minBet: number,
  rules: RuleConfig,
): SoloActionAvailability => {
  const availability: SoloActionAvailability = { ...defaultAvailability };
  if (!seat) {
    return availability;
  }

  if (phase === "betting") {
    const bet = seat.baseBet;
    availability.deal = bet >= minBet && bet <= bankroll;
    availability.clear = bet > 0;
    availability.rebet = lastBet > 0 && bet === 0 && lastBet <= bankroll;
    return availability;
  }

  if (phase === "playerActions" && activeHand) {
    availability.hit = canHit(activeHand);
    availability.stand = !activeHand.isResolved;
    availability.double = canDouble(activeHand, rules);
    availability.split = canSplit(activeHand, seat, rules);
    availability.surrender = canSurrender(activeHand, rules);
    return availability;
  }

  if (phase === "dealerPlay") {
    availability.playDealer = true;
  }

  if (phase === "settlement") {
    availability.nextRound = true;
    if (lastBet > 0 && lastBet <= bankroll) {
      availability.rebet = true;
    }
  }

  return availability;
};

const primaryActionForPhase = (phase: Phase, availability: SoloActionAvailability): SoloAction | null => {
  if (phase === "betting" && availability.deal) {
    return "deal";
  }
  if (phase === "playerActions") {
    if (availability.hit) {
      return "hit";
    }
    if (availability.stand) {
      return "stand";
    }
  }
  if (phase === "dealerPlay" && availability.playDealer) {
    return "playDealer";
  }
  if (phase === "settlement" && availability.nextRound) {
    return "nextRound";
  }
  return null;
};

const addToast = (
  setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>,
  message: string,
  tone: ToastMessage["tone"],
  timeoutMs = 3200,
) => {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  setToasts((previous) => [...previous.slice(-2), { id, message, tone }]);

  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, timeoutMs);
  }
};

export const SoloLayout: React.FC<ThemeLayoutProps> = ({
  game,
  actions,
  themeId,
  availableThemes,
  onThemeChange,
}) => {
  const seat = getPlayerSeat(game.seats);
  const [activeChip, setActiveChip] = React.useState<ChipDenomination>(25);
  const [statsOpen, setStatsOpen] = React.useState(false);
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
  const [lastBet, setLastBet] = React.useState(() => seat?.baseBet ?? 0);
  const hudCollapsed = game.phase !== "betting";

  const seatIndex = seat?.index ?? PLAYER_SEAT_INDEX;
  const seatOccupied = seat?.occupied ?? false;
  const seatBaseBet = seat?.baseBet ?? 0;

  React.useEffect(() => {
    if (seatOccupied) {
      return;
    }
    actions.sit(seatIndex);
  }, [actions, seatIndex, seatOccupied]);

  React.useEffect(() => {
    if (game.phase !== "betting" && seatBaseBet > 0) {
      setLastBet(seatBaseBet);
    }
  }, [game.phase, seatBaseBet, seat]);

  const activeHand = getActiveHand(seat, game.activeHandId);
  const availability = computeAvailability(
    game.phase,
    seat,
    activeHand,
    game.bankroll,
    lastBet,
    game.rules.minBet,
    game.rules,
  );
  const primaryAction = primaryActionForPhase(game.phase, availability);

  const insuranceHand = React.useMemo(() => {
    if (!seat || game.phase !== "insurance") {
      return undefined;
    }
    return seat.hands.find((hand) => hand.insuranceBet === undefined && !hand.isResolved);
  }, [game.phase, seat]);

  const pushMessageToast = React.useCallback(
    (message: string) => {
      const tone = classifyToast(message);
      addToast(setToasts, message, tone);
    },
    [setToasts],
  );

  const prevLogRef = React.useRef(game.messageLog);
  React.useEffect(() => {
    const previous = prevLogRef.current;
    if (game.messageLog.length > previous.length) {
      const delta = game.messageLog.slice(previous.length);
      delta.forEach((message) => pushMessageToast(message));
    }
    prevLogRef.current = game.messageLog;
  }, [game.messageLog, pushMessageToast]);

  const handleAction = React.useCallback(
    (action: SoloAction) => {
      switch (action) {
        case "deal":
          actions.deal();
          break;
        case "clear":
          if (seat) {
            actions.setBet(seat.index, 0);
          }
          break;
        case "rebet":
          if (seat && lastBet > 0) {
            actions.setBet(seat.index, lastBet);
          }
          break;
        case "hit":
          actions.playerHit();
          break;
        case "stand":
          actions.playerStand();
          break;
        case "double":
          actions.playerDouble();
          break;
        case "split":
          actions.playerSplit();
          break;
        case "surrender":
          actions.playerSurrender();
          break;
        case "playDealer":
          actions.playDealer();
          break;
        case "nextRound":
          actions.nextRound();
          break;
        default:
          break;
      }
    },
    [actions, lastBet, seat],
  );

  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const key = event.key.toLowerCase();
      switch (key) {
        case "h":
          if (availability.hit) {
            event.preventDefault();
            actions.playerHit();
          }
          break;
        case "s":
          if (availability.stand) {
            event.preventDefault();
            actions.playerStand();
          }
          break;
        case "d":
          if (availability.double) {
            event.preventDefault();
            actions.playerDouble();
          }
          break;
        case "p":
          if (availability.split) {
            event.preventDefault();
            actions.playerSplit();
          }
          break;
        case "r":
          if (availability.surrender) {
            event.preventDefault();
            actions.playerSurrender();
          }
          break;
        case "c":
          if (availability.clear && seat) {
            event.preventDefault();
            actions.setBet(seat.index, 0);
          }
          break;
        case "b":
          if (availability.rebet) {
            event.preventDefault();
            handleAction("rebet");
          }
          break;
        case " ":
        case "enter":
          if (primaryAction) {
            event.preventDefault();
            handleAction(primaryAction);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [actions, availability, handleAction, primaryAction, seat]);

  const handleInsurance = React.useCallback(
    (amount: number) => {
      if (!seat || !insuranceHand) {
        return;
      }
      actions.takeInsurance(seat.index, insuranceHand.id, amount);
    },
    [actions, insuranceHand, seat],
  );

  const handleDeclineInsurance = React.useCallback(() => {
    if (!seat || !insuranceHand) {
      return;
    }
    actions.declineInsurance(seat.index, insuranceHand.id);
  }, [actions, insuranceHand, seat]);

  const handlePlaceBet = React.useCallback(
    (value: number) => {
      if (!seat || game.phase !== "betting") {
        return;
      }
      actions.addChip(seat.index, value);
    },
    [actions, game.phase, seat],
  );

  const handleRemoveChip = React.useCallback(() => {
    if (!seat || game.phase !== "betting") {
      return;
    }
    actions.removeTopChip(seat.index);
  }, [actions, game.phase, seat]);

  const handleRebet = React.useCallback(() => {
    if (seat && lastBet > 0) {
      actions.setBet(seat.index, lastBet);
    }
  }, [actions, lastBet, seat]);

  const chipStack = ensureChipArray(seat);

  return (
    <div className="solo-layer">
      <div className="flex min-h-screen flex-col gap-6 px-4 pb-8 pt-6 md:px-10">
        <header className={cn("solo-hud transition-all duration-300", hudCollapsed && "opacity-70 backdrop-blur-sm")}>
          <div className="flex flex-col gap-4 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <SoloHUD
              bankroll={game.bankroll}
              currentBet={seat?.baseBet ?? 0}
              round={game.roundCount}
              phase={game.phase}
              shoe={game.shoe}
              rules={game.rules}
              collapsed={hudCollapsed}
              onToggleStats={() => setStatsOpen((open) => !open)}
            />
            <ThemeSwitcher themes={availableThemes} value={themeId} onChange={onThemeChange} />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6">
          <div className="flex flex-1 flex-col justify-between gap-8">
            <DealerArea dealer={game.dealer} phase={game.phase} rules={game.rules} />
            <PlayerArea
              seat={seat}
              activeHandId={game.activeHandId}
              phase={game.phase}
              activeChip={activeChip}
              onPlaceBet={handlePlaceBet}
              onRemoveChip={handleRemoveChip}
              chipStack={chipStack}
              availability={availability}
              onGesture={(gesture) => {
                if (gesture === "hit" && availability.hit) {
                  actions.playerHit();
                } else if (gesture === "stand" && availability.stand) {
                  actions.playerStand();
                } else if (gesture === "double" && availability.double) {
                  actions.playerDouble();
                }
              }}
            />
          </div>

          {insuranceHand && (
            <InsuranceStrip
              hand={insuranceHand}
              onConfirm={handleInsurance}
              onSkip={handleDeclineInsurance}
              bankroll={game.bankroll}
            />
          )}

          <div className="flex flex-col gap-4 rounded-3xl border border-[rgba(216,182,76,0.18)] bg-[rgba(12,31,24,0.65)] p-4 shadow-[var(--shadow-1)] lg:flex-row lg:items-center lg:justify-between">
            <BetChipsBar
              chips={CHIP_SET}
              activeChip={activeChip}
              onSelect={setActiveChip}
              onAdd={() => handlePlaceBet(activeChip)}
              onRemove={handleRemoveChip}
              onClear={() => seat && actions.setBet(seat.index, 0)}
              onRebet={handleRebet}
              canInteract={game.phase === "betting"}
              showRebet={availability.rebet}
            />
            <ActionBar
              availability={availability}
              primary={primaryAction}
              onAction={handleAction}
              phase={game.phase}
            />
          </div>
        </main>
      </div>
      <ToastHost messages={toasts} />
      <StatsDrawer
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        shoe={game.shoe}
        rules={game.rules}
        messageLog={game.messageLog}
      />
    </div>
  );
};

