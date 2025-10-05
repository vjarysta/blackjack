import { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";
import { Table } from "../components/Table";
import { ControlsBar } from "../components/ControlsBar";
import { RuleBadges } from "../components/RuleBadges";
import { formatCurrency } from "../utils/currency";

export default function App(): JSX.Element {
  const {
    game,
    hydrate,
    sit,
    leave,
    setBet,
    deal,
    takeInsurance,
    skipInsurance,
    continueAfterInsurance,
    hit,
    stand,
    double,
    split,
    surrender,
    playDealer,
    settle
  } = useGameStore();

  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardsRemaining = game.shoe.cards.length;
  const discardCount = game.shoe.discard.length;
  const totalCards = cardsRemaining + discardCount;
  const penetration = totalCards > 0 ? (discardCount / totalCards) * 100 : 0;

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Blackjack Table</h1>
            <p className="text-sm text-muted-foreground">
              Bankroll: {formatCurrency(game.bankroll, game.rules.currency)} • Shoe: {cardsRemaining} remaining, {discardCount} discard ({penetration.toFixed(1)}% dealt)
            </p>
          </div>
          <RuleBadges rules={game.rules} />
        </header>

        <ControlsBar
          game={game}
          onDeal={deal}
          onSkipInsurance={skipInsurance}
          onContinueInsurance={continueAfterInsurance}
          onPlayDealer={playDealer}
          onSettle={settle}
        />

        <Table
          game={game}
          onSit={sit}
          onLeave={leave}
          onSetBet={setBet}
          onHit={hit}
          onStand={stand}
          onDouble={double}
          onSplit={split}
          onSurrender={surrender}
          onInsurance={(seatIndex, hand, amount) => takeInsurance(seatIndex, hand.id, amount)}
        />

        {game.messageLog.length > 0 ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            <h2 className="mb-2 text-base font-semibold text-foreground">Messages</h2>
            <ul className="space-y-1">
              {game.messageLog.map((message, index) => (
                <li key={`${message}-${index}`}>• {message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
