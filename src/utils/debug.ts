import { useGameStore } from "../store/useGameStore";
import type { Card } from "../engine/types";

type RankInput =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

const RANK_MAP: Record<RankInput, Card["rank"]> = {
  "1": "A",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  J: "J",
  Q: "Q",
  K: "K",
  A: "A"
};

const SUITS: Card["suit"][] = ["♠", "♥", "♦", "♣"];

const normalizeRank = (value: string): Card["rank"] => {
  const key = value.toUpperCase() as RankInput;
  const mapped = RANK_MAP[key];
  if (!mapped) {
    throw new Error(
      `Invalid card rank "${value}". Use values between '1'-'10' or 'J', 'Q', 'K'.`
    );
  }
  return mapped;
};

const randomSuit = (): Card["suit"] => {
  const index = Math.floor(Math.random() * SUITS.length);
  return SUITS[index];
};

const resolveCard = (input: string | undefined, fallback?: Card): Card => {
  if (input) {
    const rank = normalizeRank(input);
    return {
      rank,
      suit: fallback?.suit ?? randomSuit()
    };
  }
  if (fallback) {
    return { ...fallback };
  }
  return { rank: "A", suit: randomSuit() };
};

const CHOOSE_CARD_POSITIONS: Array<{
  index: number;
  description: string;
}> = [
  { index: 0, description: "player first card" },
  { index: 1, description: "dealer upcard" },
  { index: 2, description: "player second card" },
  { index: 3, description: "dealer hole card" },
  { index: 4, description: "player third card" }
];

type ChooseCardsFn = (
  firstDealerCard?: string,
  secondDealerCard?: string,
  firstPlayerCard?: string,
  secondPlayerCard?: string,
  thirdPlayerCard?: string
) => void;

const chooseCards: ChooseCardsFn = (
  firstDealerCard,
  secondDealerCard,
  firstPlayerCard,
  secondPlayerCard,
  thirdPlayerCard
) => {
  useGameStore.setState((store) => {
    const nextGame = structuredClone(store.game);
    const nextCards = [...nextGame.shoe.cards];

    const inputs = [
      firstPlayerCard,
      firstDealerCard,
      secondPlayerCard,
      secondDealerCard,
      thirdPlayerCard
    ];

    CHOOSE_CARD_POSITIONS.forEach(({ index }, position) => {
      nextCards[index] = resolveCard(inputs[position], nextCards[index]);
    });

    nextGame.shoe.cards = nextCards;

    return { game: nextGame };
  });
};

export const registerDebugHelpers = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  const existing = window as Window & { chooseCards?: ChooseCardsFn };
  existing.chooseCards = chooseCards;
};

declare global {
  interface Window {
    chooseCards: ChooseCardsFn;
  }
}
