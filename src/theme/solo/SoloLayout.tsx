import React from "react";
import { canDouble, canHit, canSplit, canSurrender } from "../../engine/rules";
import type { Hand, Phase, Seat } from "../../engine/types";
import type { ChipDenomination } from "../../theme/palette";
import { ThemeLayoutProps } from "../registry";
import { SoloHUD } from "./components/SoloHUD";
import { DealerArea } from "./components/DealerArea";
import { PlayerArea } from "./components/PlayerArea";
import { BetChipsBar } from "./components/BetChipsBar";
import { ActionBar, type SoloAction } from "./components/ActionBar";
import { InsuranceStrip } from "./components/InsuranceStrip";
import { StatsDrawer } from "./components/StatsDrawer";
import { Toast } from "./components/Toast";

const SOLO_SEAT_INDEX = 0;
const CHIP_DEFAULT: ChipDenomination = 25;

const findPrimarySeat = (seats: Seat[]): Seat => seats[SOLO_SEAT_INDEX] ?? seats[0];

const findActiveHand = (handId: string | null, seat: Seat): Hand | null => {
  if (!handId) return null;
  return seat.hands.find((hand) => hand.id === handId) ?? null;
};

const computeAvailableActions = (
  phase: Phase,
  seat: Seat,
  activeHand: Hand | null,
  bankroll: number,
  rules: ThemeLayoutProps["game"]["rules"],
  lastBet: number
): Set<SoloAction> => {
  const actions = new Set<SoloAction>();
  if (phase === "betting") {
    if (seat.baseBet > 0) {
      actions.add("deal");
      actions.add("clear");
    }
    if (lastBet > 0 && bankroll + seat.baseBet >= lastBet) {
      actions.add("rebet");
    }
  }

  if (phase === "playerActions" && activeHand) {
    if (canHit(activeHand)) {
      actions.add("hit");
    }
    if (!activeHand.isResolved) {
      actions.add("stand");
    }
    if (canDouble(activeHand, rules) && bankroll >= activeHand.bet) {
      actions.add("double");
    }
    if (canSplit(activeHand, seat, rules) && bankroll >= activeHand.bet) {
      actions.add("split");
    }
    if (canSurrender(activeHand, rules)) {
      actions.add("surrender");
    }
  }

  if (phase === "dealerPlay") {
    actions.add("play-dealer");
  }

  if (phase === "settlement") {
    actions.add("next-round");
    if (lastBet > 0 && bankroll >= lastBet) {
      actions.add("rebet");
    }
  }

  return actions;
};

const primaryActionForPhase = (phase: Phase, available: Set<SoloAction>): SoloAction | null => {
  if (phase === "betting" && available.has("deal")) return "deal";
  if (phase === "playerActions" && available.has("hit")) return "hit";
  if (phase === "dealerPlay" && available.has("play-dealer")) return "play-dealer";
  if (phase === "settlement" && available.has("next-round")) return "next-round";
  return null;
};

const insuranceCandidates = (seat: Seat): Hand[] =>
  seat.hands.filter((hand) => hand.insuranceBet === undefined && !hand.isResolved);

export const SoloLayout: React.FC<ThemeLayoutProps> = ({ game, actions }) => {
  const seat = findPrimarySeat(game.seats);
  const [activeChip, setActiveChip] = React.useState<ChipDenomination>(CHIP_DEFAULT);
  const [statsOpen, setStatsOpen] = React.useState(false);
  const [lastBet, setLastBet] = React.useState(() => seat.baseBet);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const toastTimer = React.useRef<number | null>(null);
  const activeHand = findActiveHand(game.activeHandId, seat);

  const availableActions = React.useMemo(
    () => computeAvailableActions(game.phase, seat, activeHand, game.bankroll, game.rules, lastBet),
    [activeHand, game.bankroll, game.phase, game.rules, lastBet, seat]
  );

  const primaryAction = React.useMemo(
    () => primaryActionForPhase(game.phase, availableActions),
    [game.phase, availableActions]
  );

  const hudCollapsed = game.phase !== "betting";

  React.useEffect(() => {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    const last = game.messageLog[game.messageLog.length - 1] ?? null;
    if (last) {
      setToastMessage(last);
      toastTimer.current = window.setTimeout(() => setToastMessage(null), 3000);
    }
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, [game.messageLog]);

  const prevPhaseRef = React.useRef<Phase>(game.phase);
  React.useEffect(() => {
    const prev = prevPhaseRef.current;
    if (prev === "betting" && game.phase !== "betting" && seat.baseBet > 0) {
      setLastBet(seat.baseBet);
    }
    if (!seat.occupied) {
      setLastBet(0);
    }
    prevPhaseRef.current = game.phase;
  }, [game.phase, seat.baseBet, seat.occupied]);

  React.useEffect(() => {
    if (game.phase === "betting" && seat.baseBet > 0) {
      setLastBet((current) => (current === 0 ? seat.baseBet : current));
    }
  }, [game.phase, seat.baseBet]);

  const handleAction = (action: SoloAction) => {
    switch (action) {
      case "deal":
        actions.deal();
        break;
      case "clear":
        actions.setBet(seat.index, 0);
        break;
      case "rebet":
        actions.setBet(seat.index, lastBet);
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
      case "play-dealer":
        actions.playDealer();
        break;
      case "next-round":
        actions.nextRound();
        break;
      default:
        break;
    }
  };

  const keyboardHandler = React.useCallback(
    (event: KeyboardEvent) => {
      const tagName = (event.target as HTMLElement | null)?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA") {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === " " || key === "enter") {
        if (primaryAction) {
          event.preventDefault();
          handleAction(primaryAction);
        }
        return;
      }
      if (key === "h" && availableActions.has("hit")) handleAction("hit");
      if (key === "s" && availableActions.has("stand")) handleAction("stand");
      if (key === "d" && availableActions.has("double")) handleAction("double");
      if (key === "p" && availableActions.has("split")) handleAction("split");
      if (key === "r" && availableActions.has("surrender")) handleAction("surrender");
      if (key === "c" && availableActions.has("clear")) handleAction("clear");
      if (key === "i" && game.phase === "insurance") {
        const hands = insuranceCandidates(seat);
        if (hands.length > 0) {
          const amount = Math.min(Math.floor(hands[0].bet / 2), Math.floor(game.bankroll));
          actions.takeInsurance(seat.index, hands[0].id, amount);
        }
      }
    },
    [availableActions, game.bankroll, game.phase, handleAction, primaryAction, seat, actions]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", keyboardHandler);
    return () => window.removeEventListener("keydown", keyboardHandler);
  }, [keyboardHandler]);

  const handleAddChip = (value: ChipDenomination) => {
    if (game.phase !== "betting") return;
    if (!seat.occupied) {
      actions.sit(seat.index);
    }
    const totalBets = game.seats.reduce((sum, seatState) => sum + seatState.baseBet, 0);
    const remainingBankroll = Math.max(0, Math.floor(game.bankroll - (totalBets - seat.baseBet)));
    const nextBet = seat.baseBet + value;
    if (remainingBankroll <= 0 || nextBet > game.rules.maxBet) {
      return;
    }
    const denom = Math.min(value, remainingBankroll);
    if (denom > 0) {
      actions.addChip(seat.index, denom);
    }
  };

  const insuranceHands = React.useMemo(() => insuranceCandidates(seat), [seat]);
  const revealHole =
    game.phase === "dealerPlay" || game.phase === "settlement" || game.dealer.hand.isBlackjack;

  const handleInsurance = (handId: string, amount: number) => {
    actions.takeInsurance(seat.index, handId, amount);
  };

  const handleDeclineInsurance = (handId: string) => {
    actions.declineInsurance(seat.index, handId);
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-[var(--bg)] px-4 py-6 text-[var(--text-hi)]">
      <SoloHUD
        bankroll={game.bankroll}
        bet={seat.baseBet}
        round={game.roundCount}
        phase={game.phase}
        shoe={game.shoe}
        statsOpen={statsOpen}
        collapsed={hudCollapsed}
        onToggleStats={() => setStatsOpen((value) => !value)}
      />

      <main className="flex flex-1 flex-col items-center gap-6">
        <DealerArea hand={game.dealer.hand} revealHole={revealHole} phase={game.phase} rules={game.rules} />
        <PlayerArea
          seat={seat}
          activeHandId={game.activeHandId}
          phase={game.phase}
          minBet={game.rules.minBet}
          bankroll={game.bankroll}
          availableActions={availableActions}
          onSit={() => actions.sit(seat.index)}
          onLeave={() => actions.leave(seat.index)}
          gestureHandlers={{
            onHit: availableActions.has("hit") ? () => handleAction("hit") : undefined,
            onStand: availableActions.has("stand") ? () => handleAction("stand") : undefined,
            onDouble: availableActions.has("double") ? () => handleAction("double") : undefined
          }}
        />
      </main>

      {game.phase === "insurance" && seat.occupied && (
        <InsuranceStrip
          seatIndex={seat.index}
          hands={insuranceHands}
          bankroll={game.bankroll}
          onInsurance={handleInsurance}
          onDecline={handleDeclineInsurance}
        />
      )}

      <footer className="flex w-full flex-col gap-3 pb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <BetChipsBar
            activeChip={activeChip}
            currentBet={seat.baseBet}
            disabled={game.phase !== "betting" || !seat.occupied}
            canClear={seat.baseBet > 0 && game.phase === "betting"}
            canRebet={availableActions.has("rebet")}
            onSelectChip={setActiveChip}
            onAddChip={handleAddChip}
            onClear={() => handleAction("clear")}
            onRebet={() => handleAction("rebet")}
          />
          <ActionBar available={availableActions} primary={primaryAction} onInvoke={handleAction} />
        </div>
      </footer>

      <StatsDrawer game={game} open={statsOpen} onClose={() => setStatsOpen(false)} />
      <Toast message={toastMessage} />
    </div>
  );
};
