import type { RuleConfig } from "../engine/types";

export type Action = "hit" | "stand" | "double" | "split" | "surrender" | "insurance-skip";
export type HandKind = "pair" | "soft" | "hard";

export type PlayerContext = {
  dealerUpcard: { rank: DealerRank; value10?: boolean };
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

export type DealerRank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";

type StrategyCell = { action: Action; fallback?: Action };

type StrategyRow = Record<DealerRank, StrategyCell>;

type StrategyTable = Record<string, StrategyRow>;

const DEALER_ORDER: DealerRank[] = ["A", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

const makeRow = (value: Partial<Record<DealerRank, StrategyCell>>, defaultCell: StrategyCell): StrategyRow => {
  return DEALER_ORDER.reduce<StrategyRow>((row, dealer) => {
    row[dealer] = value[dealer] ?? defaultCell;
    return row;
  }, {} as StrategyRow);
};

const pairStrategy: StrategyTable = {
  A: makeRow({}, { action: "split" }),
  "10": makeRow({}, { action: "stand" }),
  "9": makeRow(
    {
      A: { action: "stand" },
      "10": { action: "stand" },
      "8": { action: "split" },
      "7": { action: "stand" }
    },
    { action: "split" }
  ),
  "8": makeRow({}, { action: "split" }),
  "7": makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" }
    },
    { action: "split" }
  ),
  "6": makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" }
    },
    { action: "split" }
  ),
  "5": makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" }
    },
    { action: "double", fallback: "hit" }
  ),
  "4": makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" },
      "3": { action: "hit" },
      "2": { action: "hit" }
    },
    { action: "split" }
  ),
  "3": makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" }
    },
    { action: "split" }
  ),
  "2": makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" }
    },
    { action: "split" }
  )
};

const softStrategy: Record<number, StrategyRow> = {
  13: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" },
      "6": { action: "double", fallback: "hit" },
      "5": { action: "double", fallback: "hit" },
      "4": { action: "hit" },
      "3": { action: "hit" },
      "2": { action: "hit" }
    },
    { action: "hit" }
  ),
  14: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" },
      "6": { action: "double", fallback: "hit" },
      "5": { action: "double", fallback: "hit" },
      "4": { action: "hit" },
      "3": { action: "hit" },
      "2": { action: "hit" }
    },
    { action: "hit" }
  ),
  15: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" },
      "6": { action: "double", fallback: "hit" },
      "5": { action: "double", fallback: "hit" },
      "4": { action: "double", fallback: "hit" }
    },
    { action: "hit" }
  ),
  16: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" },
      "6": { action: "double", fallback: "hit" },
      "5": { action: "double", fallback: "hit" },
      "4": { action: "double", fallback: "hit" }
    },
    { action: "hit" }
  ),
  17: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" },
      "6": { action: "double", fallback: "hit" },
      "5": { action: "double", fallback: "hit" },
      "4": { action: "double", fallback: "hit" },
      "3": { action: "double", fallback: "hit" }
    },
    { action: "hit" }
  ),
  18: makeRow(
    {
      A: { action: "stand" },
      "10": { action: "stand" },
      "9": { action: "hit" },
      "8": { action: "stand" },
      "7": { action: "stand" },
      "6": { action: "double", fallback: "stand" },
      "5": { action: "double", fallback: "stand" },
      "4": { action: "double", fallback: "stand" },
      "3": { action: "double", fallback: "stand" },
      "2": { action: "stand" }
    },
    { action: "stand" }
  ),
  19: makeRow(
    {
      A: { action: "stand" },
      "10": { action: "stand" },
      "9": { action: "stand" },
      "8": { action: "stand" },
      "7": { action: "stand" },
      "6": { action: "double", fallback: "stand" }
    },
    { action: "stand" }
  ),
  20: makeRow(
    {
      A: { action: "stand" },
      "10": { action: "stand" },
      "9": { action: "stand" },
      "8": { action: "stand" },
      "7": { action: "stand" },
      "6": { action: "double", fallback: "stand" }
    },
    { action: "stand" }
  )
};

const hardStrategy: Record<number, StrategyRow> = {
  20: makeRow({}, { action: "stand" }),
  19: makeRow({}, { action: "stand" }),
  18: makeRow({}, { action: "stand" }),
  17: makeRow({}, { action: "stand" }),
  16: makeRow(
    {
      A: { action: "surrender", fallback: "hit" },
      "10": { action: "surrender", fallback: "hit" },
      "9": { action: "surrender", fallback: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" }
    },
    { action: "stand" }
  ),
  15: makeRow(
    {
      A: { action: "surrender", fallback: "hit" },
      "10": { action: "surrender", fallback: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" }
    },
    { action: "stand" }
  ),
  14: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" }
    },
    { action: "stand" }
  ),
  13: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" }
    },
    { action: "stand" }
  ),
  12: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" },
      "3": { action: "hit" },
      "2": { action: "hit" }
    },
    { action: "stand" }
  ),
  11: makeRow(
    {
      A: { action: "hit" }
    },
    { action: "double", fallback: "hit" }
  ),
  10: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" }
    },
    { action: "double", fallback: "hit" }
  ),
  9: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" },
      "2": { action: "hit" }
    },
    { action: "double", fallback: "hit" }
  ),
  8: makeRow(
    {
      A: { action: "hit" },
      "10": { action: "hit" },
      "9": { action: "hit" },
      "8": { action: "hit" },
      "7": { action: "hit" },
      "4": { action: "hit" },
      "3": { action: "hit" },
      "2": { action: "hit" }
    },
    { action: "double", fallback: "hit" }
  ),
  7: makeRow({}, { action: "hit" }),
  6: makeRow({}, { action: "hit" }),
  5: makeRow({}, { action: "hit" })
};

const TEN_RANKS = new Set(["10", "J", "Q", "K"]);

export const toDealerRank = (rank: string): DealerRank => {
  if (rank === "A") {
    return "A";
  }
  if (TEN_RANKS.has(rank)) {
    return "10";
  }
  const numeric = Number.parseInt(rank, 10);
  if (numeric >= 2 && numeric <= 10) {
    return String(numeric) as DealerRank;
  }
  return "10";
};

const cardValue = (rank: string): number => {
  if (rank === "A") {
    return 1;
  }
  if (TEN_RANKS.has(rank)) {
    return 10;
  }
  const numeric = Number.parseInt(rank, 10);
  return Number.isFinite(numeric) ? numeric : 0;
};

const arePairCards = (cards: PlayerContext["cards"], rules: RuleConfig): boolean => {
  if (cards.length !== 2) {
    return false;
  }
  const [first, second] = cards;
  if (rules.splitPairsEqualRankOnly) {
    return first.rank === second.rank;
  }
  if (TEN_RANKS.has(first.rank) && TEN_RANKS.has(second.rank)) {
    return true;
  }
  return first.rank === second.rank;
};

export const totalHard = (cards: PlayerContext["cards"]): number =>
  cards.reduce((sum, card) => sum + cardValue(card.rank), 0);

export const isSoft = (cards: PlayerContext["cards"]): boolean => {
  const hard = totalHard(cards);
  if (hard > 11) {
    return false;
  }
  return cards.some((card) => card.rank === "A");
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

const resolveTableRef = (rules: RuleConfig): string => {
  const s17Part = rules.dealerStandsOnSoft17 ? "S17" : "H17";
  const surrenderPart = rules.surrender === "none" ? "No-Surr" : rules.surrender === "late" ? "Late-Surr" : "Early-Surr";
  const dasPart = rules.doubleAfterSplit ? "DAS" : "No-DAS";
  return `6D-${s17Part}-${surrenderPart}-${dasPart}`;
};

const describeKind = (kind: HandKind, cards: PlayerContext["cards"], total: number): string => {
  if (kind === "pair") {
    const rank = cards[0]?.rank ?? "?";
    const label = TEN_RANKS.has(rank) ? "10" : rank;
    return `Pair ${label}s`;
  }
  if (kind === "soft") {
    const hard = totalHard(cards);
    const softTotal = hard + 10;
    return `Soft ${softTotal}`;
  }
  return `Hard ${total}`;
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

const applyRuleAdjustments = (
  kind: HandKind,
  cell: StrategyCell,
  ctx: PlayerContext,
  rules: RuleConfig,
  total: number,
  dealer: DealerRank
): StrategyCell => {
  const hardTotal = totalHard(ctx.cards);
  const softTotal = hardTotal + 10;
  if (kind === "hard" && hardTotal === 11 && dealer === "A" && !rules.dealerStandsOnSoft17) {
    return { action: "double", fallback: "hit" };
  }
  if (kind === "soft" && softTotal === 18 && dealer === "A" && !rules.dealerStandsOnSoft17) {
    return { action: "hit" };
  }
  if (cell.action === "double") {
    const allowedByRules =
      ctx.isInitialTwoCards && (!ctx.afterSplit || rules.doubleAfterSplit) && canDoubleByRule(rules, kind === "soft" ? hardTotal : total);
    if (!allowedByRules) {
      return { action: cell.action, fallback: cell.fallback ?? "hit" };
    }
  }
  if (cell.action === "surrender" && rules.surrender === "none") {
    return { action: cell.action, fallback: cell.fallback ?? "hit" };
  }
  return cell;
};

const selectCell = (kind: HandKind, ctx: PlayerContext, rules: RuleConfig): { cell: StrategyCell; total: number } => {
  const dealer = ctx.dealerUpcard.rank;
  if (kind === "pair") {
    const rank = toDealerRank(ctx.cards[0]?.rank ?? "10");
    const table = pairStrategy[rank] ?? pairStrategy["10"];
    return { cell: table[dealer], total: totalHard(ctx.cards) };
  }
  const hardTotal = totalHard(ctx.cards);
  if (kind === "soft") {
    const softTotal = hardTotal + 10;
    const table = softStrategy[softTotal];
    const cell = table ? table[dealer] : { action: "stand" };
    return { cell, total: softTotal };
  }
  const table = hardStrategy[hardTotal];
  const cell = table ? table[dealer] : { action: hardTotal >= 17 ? "stand" : "hit" };
  return { cell, total: hardTotal };
};

export const getRecommendation = (ctx: PlayerContext, rules: RuleConfig): Recommendation => {
  const dealerRank = toDealerRank(ctx.dealerUpcard.rank);
  const dealer = { rank: dealerRank, value10: ctx.dealerUpcard.value10 ?? TEN_RANKS.has(ctx.dealerUpcard.rank) };
  const cards = ctx.cards;

  const isPairHand = ctx.legal.split && arePairCards(cards, rules);
  const kind: HandKind = isPairHand ? "pair" : isSoft(cards) ? "soft" : "hard";

  const { cell, total } = selectCell(kind, { ...ctx, dealerUpcard: dealer }, rules);
  const adjustedCell = applyRuleAdjustments(
    kind,
    cell,
    { ...ctx, dealerUpcard: dealer },
    rules,
    total,
    dealerRank
  );

  let best = adjustedCell.action;
  let fallback = adjustedCell.fallback;

  if (best === "double") {
    const canDouble =
      ctx.legal.double &&
      ctx.isInitialTwoCards &&
      (!ctx.afterSplit || rules.doubleAfterSplit) &&
      canDoubleByRule(rules, total) &&
      ctx.legal.hit; // fallback requires hit availability otherwise stand fallback will be used
    if (!canDouble) {
      fallback = fallback ?? (kind === "soft" && total >= 18 ? "stand" : "hit");
    }
  }

  if (best === "surrender" && !ctx.legal.surrender) {
    fallback = fallback ?? (ctx.legal.hit ? "hit" : "stand");
  }

  let legalBest = best;
  if (best === "double" && (!ctx.legal.double || !ctx.isInitialTwoCards)) {
    legalBest = fallback ?? "hit";
  } else if (best === "surrender" && !ctx.legal.surrender) {
    legalBest = fallback ?? (ctx.legal.hit ? "hit" : "stand");
  } else if (best === "split" && !ctx.legal.split) {
    legalBest = fallback ?? (ctx.legal.hit ? "hit" : "stand");
  }

  const handDescription = describeKind(kind, cards, kind === "soft" ? total : totalHard(cards));
  const tableRef = resolveTableRef(rules);
  const reasoning = `${handDescription} vs ${dealerRank} → ${actionLabel(legalBest === best ? best : legalBest)} (${tableRef})`;

  return {
    kind,
    best,
    fallback: legalBest !== best ? legalBest : fallback,
    reasoning,
    tableRef
  };
};
