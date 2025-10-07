import type { RuleConfig } from "../engine/types";

export type Action = "hit" | "stand" | "double" | "split" | "surrender" | "insurance-skip";
export type HandKind = "pair" | "soft" | "hard";

export type PlayerContext = {
  dealerUpcard: { rank: "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"; value10?: boolean };
  cards: Array<{ rank: string }>;
  isInitialTwoCards: boolean;
  afterSplit: boolean;
  legal: { hit: boolean; stand: boolean; double: boolean; split: boolean; surrender: boolean };
};

export type Recommendation = {
  kind: HandKind;
  best: Action;
  fallback?: Action;
  reasoning: string;
  tableRef: string;
};

type DealerUpcard = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A";
type StrategyCode =
  | "H"
  | "S"
  | "Dh"
  | "Ds"
  | "Rh"
  | "Rs"
  | "P"
  | "Ph"
  | "Ps"
  | "Pd";

type StrategyTable = Record<string, Partial<Record<DealerUpcard, StrategyCode>>>;

const dealerOrder: DealerUpcard[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

const HARD_TOTALS: StrategyTable = {
  "5": fillRow("H"),
  "6": fillRow("H"),
  "7": fillRow("H"),
  "8": withEntries("H", { "5": "Dh", "6": "Dh" }),
  "9": withEntries("H", { "3": "Dh", "4": "Dh", "5": "Dh", "6": "Dh" }),
  "10": withEntries("H", { "2": "Dh", "3": "Dh", "4": "Dh", "5": "Dh", "6": "Dh", "7": "Dh", "8": "Dh", "9": "Dh" }),
  "11": withEntries("H", { "2": "Dh", "3": "Dh", "4": "Dh", "5": "Dh", "6": "Dh", "7": "Dh", "8": "Dh", "9": "Dh", "10": "Dh" }),
  "12": withEntries("H", { "4": "S", "5": "S", "6": "S" }),
  "13": withEntries("H", { "2": "S", "3": "S", "4": "S", "5": "S", "6": "S" }),
  "14": withEntries("H", { "2": "S", "3": "S", "4": "S", "5": "S", "6": "S" }),
  "15": withEntries("H", { "2": "S", "3": "S", "4": "S", "5": "S", "6": "S", "10": "Rh" }),
  "16": withEntries("H", { "2": "S", "3": "S", "4": "S", "5": "S", "6": "S", "9": "Rh", "10": "Rh", "A": "Rh" }),
  "17": fillRow("S"),
  "18": fillRow("S"),
  "19": fillRow("S"),
  "20": fillRow("S")
};

const SOFT_TOTALS: StrategyTable = {
  "13": withEntries("H", { "5": "Dh", "6": "Dh" }),
  "14": withEntries("H", { "5": "Dh", "6": "Dh" }),
  "15": withEntries("H", { "4": "Dh", "5": "Dh", "6": "Dh" }),
  "16": withEntries("H", { "4": "Dh", "5": "Dh", "6": "Dh" }),
  "17": withEntries("H", { "3": "Dh", "4": "Dh", "5": "Dh", "6": "Dh" }),
  "18": withEntries("S", { "3": "Ds", "4": "Ds", "5": "Ds", "6": "Ds", "9": "H", "10": "H" }),
  "19": withEntries("S", { "6": "Ds" }),
  "20": fillRow("S"),
  "21": fillRow("S")
};

const PAIR_ACTIONS: StrategyTable = {
  "A": fillRow("P"),
  "10": fillRow("S"),
  "9": withEntries("S", { "2": "P", "3": "P", "4": "P", "5": "P", "6": "P", "8": "P", "9": "P" }),
  "8": fillRow("P"),
  "7": withEntries("H", { "2": "P", "3": "P", "4": "P", "5": "P", "6": "P", "7": "P" }),
  "6": withEntries("H", { "2": "P", "3": "P", "4": "P", "5": "P", "6": "P" }),
  "5": HARD_TOTALS["10"],
  "4": withEntries("H", { "5": "Pd", "6": "Pd" }),
  "3": withEntries("H", { "2": "P", "3": "P", "4": "P", "5": "P", "6": "P", "7": "P" }),
  "2": withEntries("H", { "2": "P", "3": "P", "4": "P", "5": "P", "6": "P", "7": "P" })
};

function fillRow(code: StrategyCode): Partial<Record<DealerUpcard, StrategyCode>> {
  return dealerOrder.reduce<Partial<Record<DealerUpcard, StrategyCode>>>((row, dealer) => {
    row[dealer] = code;
    return row;
  }, {});
}

function withEntries(
  base: StrategyCode,
  entries: Partial<Record<DealerUpcard, StrategyCode>>
): Partial<Record<DealerUpcard, StrategyCode>> {
  const row = fillRow(base);
  Object.assign(row, entries);
  return row;
}

const TEN_RANKS = new Set(["10", "J", "Q", "K"]);

const rankToDealerKey = (rank: string): DealerUpcard => {
  if (rank === "A") {
    return "A";
  }
  if (TEN_RANKS.has(rank)) {
    return "10";
  }
  if (dealerOrder.includes(rank as DealerUpcard)) {
    return rank as DealerUpcard;
  }
  return "10";
};

const actionFromCode = (code: StrategyCode): { best: Action; fallback?: Action } => {
  switch (code) {
    case "H":
      return { best: "hit" };
    case "S":
      return { best: "stand" };
    case "Dh":
      return { best: "double", fallback: "hit" };
    case "Ds":
      return { best: "double", fallback: "stand" };
    case "Rh":
      return { best: "surrender", fallback: "hit" };
    case "Rs":
      return { best: "surrender", fallback: "stand" };
    case "P":
      return { best: "split" };
    case "Ph":
      return { best: "split", fallback: "hit" };
    case "Ps":
      return { best: "split", fallback: "stand" };
    case "Pd":
      return { best: "split", fallback: "double" };
    default:
      return { best: "hit" };
  }
};

const actionLabel = (action: Action): string => {
  switch (action) {
    case "hit":
      return "Hit";
    case "stand":
      return "Stand";
    case "double":
      return "Double";
    case "split":
      return "Split";
    case "surrender":
      return "Surrender";
    case "insurance-skip":
      return "Skip Insurance";
    default:
      return action;
  }
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const toTableRef = (rules: RuleConfig): string => {
  const base = `6D-${rules.dealerStandsOnSoft17 ? "S17" : "H17"}`;
  const surrender =
    rules.surrender === "none"
      ? "No-Surr"
      : rules.surrender === "early"
        ? "Early-Surr"
        : "Late-Surr";
  const das = rules.doubleAfterSplit ? "DAS" : "NoDAS";
  return `${base}-${surrender}-${das}`;
};

const chooseAction = (
  candidates: Action[],
  legal: PlayerContext["legal"]
): { chosen: Action | null; fallback?: Action } => {
  for (let index = 0; index < candidates.length; index += 1) {
    const action = candidates[index];
    if (action === "hit" && legal.hit) {
      return { chosen: action, fallback: index === 0 ? undefined : action };
    }
    if (action === "stand" && legal.stand) {
      return { chosen: action, fallback: index === 0 ? undefined : action };
    }
    if (action === "double" && legal.double) {
      return { chosen: action, fallback: index === 0 ? undefined : action };
    }
    if (action === "split" && legal.split) {
      return { chosen: action, fallback: index === 0 ? undefined : action };
    }
    if (action === "surrender" && legal.surrender) {
      return { chosen: action, fallback: index === 0 ? undefined : action };
    }
  }
  return { chosen: null };
};

export const totalHard = (cards: Array<{ rank: string }>): number => {
  return cards.reduce((sum, card) => {
    if (card.rank === "A") {
      return sum + 1;
    }
    if (TEN_RANKS.has(card.rank)) {
      return sum + 10;
    }
    const numeric = Number.parseInt(card.rank, 10);
    return Number.isNaN(numeric) ? sum + 10 : sum + numeric;
  }, 0);
};

export const isSoft = (cards: Array<{ rank: string }>): boolean => {
  const hard = totalHard(cards);
  const aceCount = cards.filter((card) => card.rank === "A").length;
  if (aceCount === 0) {
    return false;
  }
  return hard + 10 <= 21;
};

export const canDoubleByRule = (rules: RuleConfig, total: number): boolean => {
  switch (rules.doubleAllowed) {
    case "anyTwo":
      return true;
    case "9to11":
      return total >= 9 && total <= 11;
    case "10to11":
      return total >= 10 && total <= 11;
    default:
      return false;
  }
};

const resolveStrategyCode = (
  kind: HandKind,
  playerValue: string,
  dealer: DealerUpcard
): StrategyCode => {
  const table = kind === "pair" ? PAIR_ACTIONS : kind === "soft" ? SOFT_TOTALS : HARD_TOTALS;
  const key = playerValue;
  const row = table[key];
  const fallbackRow = kind === "pair" && !row ? HARD_TOTALS[key] : undefined;
  if (row && row[dealer]) {
    return row[dealer] as StrategyCode;
  }
  if (fallbackRow && fallbackRow[dealer]) {
    return fallbackRow[dealer] as StrategyCode;
  }
  return "H";
};

const describeHand = (kind: HandKind, cards: PlayerContext["cards"], total: number): string => {
  if (kind === "pair") {
    const rank = cards[0]?.rank ?? "?";
    return `Pair ${rank === "A" ? "Aces" : `${rank}s`}`;
  }
  if (kind === "soft") {
    return `Soft ${total}`;
  }
  return `Hard ${total}`;
};

export function getRecommendation(ctx: PlayerContext, rules: RuleConfig): Recommendation {
  const legal = ctx.legal;
  const dealer = rankToDealerKey(ctx.dealerUpcard.value10 ? "10" : ctx.dealerUpcard.rank);
  const hardTotal = totalHard(ctx.cards);
  const softHand = isSoft(ctx.cards);

  const deriveKind = (): HandKind => {
    if (
      ctx.cards.length === 2 &&
      ctx.isInitialTwoCards &&
      !ctx.afterSplit &&
      legal.split &&
      ctx.cards[0]?.rank === ctx.cards[1]?.rank
    ) {
      return "pair";
    }
    if (softHand) {
      return "soft";
    }
    return "hard";
  };

  let kind = deriveKind();
  const softTotal = hardTotal + 10;
  let tableKey =
    kind === "pair"
      ? pairKeyFromRank(ctx.cards[0]?.rank ?? "")
      : String(kind === "soft" ? softTotal : hardTotal);
  let code = resolveStrategyCode(kind, tableKey, dealer);
  let { best, fallback } = actionFromCode(code);

  if (best === "split" && !legal.split) {
    kind = softHand ? "soft" : "hard";
    tableKey = String(kind === "soft" ? softTotal : hardTotal);
    code = resolveStrategyCode(kind, tableKey, dealer);
    ({ best, fallback } = actionFromCode(code));
  }

  const totalForDouble = kind === "soft" ? softTotal : hardTotal;

  if (!rules.dealerStandsOnSoft17 && kind === "hard" && hardTotal === 11 && dealer === "A") {
    best = "double";
    fallback = "hit";
  }

  if (!rules.dealerStandsOnSoft17 && kind === "soft" && Number.parseInt(tableKey, 10) === 18 && dealer === "A") {
    best = "hit";
    fallback = undefined;
  }

  const candidates: Action[] = [best];
  if (fallback) {
    candidates.push(fallback);
  }
  if (best === "double") {
    candidates.push("hit", "stand");
  }
  if (best === "surrender") {
    candidates.push(fallback ?? "hit", "stand");
  }

  if (best === "double" && !canDoubleByRule(rules, totalForDouble)) {
    candidates.unshift(fallback ?? "hit");
  }

  const { chosen, fallback: resolvedFallback } = chooseAction(candidates, legal);
  const finalAction = chosen ?? (legal.stand ? "stand" : "hit");
  const fallbackAction = finalAction === best ? fallback : resolvedFallback ?? (finalAction === best ? undefined : finalAction);

  const tableRef = toTableRef(rules);
  const description = describeHand(kind, ctx.cards, kind === "soft" ? softTotal : hardTotal);
  const reasoning = `${description} vs ${dealer} → ${actionLabel(finalAction)} (${tableRef})`;

  return {
    kind,
    best,
    fallback: finalAction === best ? fallbackAction : finalAction,
    reasoning,
    tableRef
  };
}

const pairKeyFromRank = (rank: string): string => {
  if (rank === "A") {
    return "A";
  }
  if (TEN_RANKS.has(rank)) {
    return "10";
  }
  return String(Number.parseInt(rank, 10) || rank || "10");
};
