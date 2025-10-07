import { describe, expect, it } from "vitest";
import { defaultRuleConfig } from "../src/engine/rules.config";
import { getRecommendation, type PlayerContext, type Recommendation } from "../src/utils/basicStrategy";
import type { RuleConfig } from "../src/engine/types";

const createContext = (
  cards: string[],
  dealer: string,
  overrides: Partial<PlayerContext> = {}
): PlayerContext => {
  const tenRanks = new Set(["10", "J", "Q", "K"]);
  const isPair = cards.length === 2 && (cards[0] === cards[1] || (tenRanks.has(cards[0]) && tenRanks.has(cards[1])));
  const legal = overrides.legal ?? {
    hit: true,
    stand: true,
    double: cards.length === 2,
    split: isPair,
    surrender: true
  };
  return {
    dealerUpcard: { rank: dealer as PlayerContext["dealerUpcard"]["rank"] },
    cards: cards.map((rank) => ({ rank })),
    isInitialTwoCards: overrides.isInitialTwoCards ?? cards.length === 2,
    afterSplit: overrides.afterSplit ?? false,
    legal,
    ...overrides
  };
};

const recommend = (
  cards: string[],
  dealer: string,
  rules: RuleConfig = defaultRuleConfig,
  overrides: Partial<PlayerContext> = {}
): Recommendation => getRecommendation(createContext(cards, dealer, overrides), rules);

describe("basic strategy recommendations", () => {
  it("advises surrender on hard 16 vs 10 when available", () => {
    const rec = recommend(["9", "7"], "10");
    expect(rec.best).toBe("surrender");
  });

  it("falls back when surrender is not available", () => {
    const rules: RuleConfig = { ...defaultRuleConfig, surrender: "none" };
    const rec = recommend(["9", "7"], "10", rules, { legal: { hit: true, stand: true, double: true, split: false, surrender: false } });
    expect(rec.best).toBe("surrender");
    expect(rec.fallback).toBe("hit");
  });

  it("hits hard 12 vs 3", () => {
    const rec = recommend(["10", "2"], "3");
    expect(rec.best).toBe("hit");
  });

  it("hits hard 11 vs ace with S17 rules", () => {
    const rec = recommend(["6", "5"], "A");
    expect(rec.best).toBe("hit");
  });

  it("doubles hard 11 vs ace on H17 tables", () => {
    const rules: RuleConfig = { ...defaultRuleConfig, dealerStandsOnSoft17: false };
    const rec = recommend(["6", "5"], "A", rules);
    expect(rec.best).toBe("double");
  });

  it("doubles hard 9 vs 3 when allowed", () => {
    const rec = recommend(["6", "3"], "3");
    expect(rec.best).toBe("double");
  });

  it("hits soft 18 vs 9", () => {
    const rec = recommend(["A", "7"], "9");
    expect(rec.best).toBe("hit");
  });

  it("doubles soft 19 vs 6", () => {
    const rec = recommend(["A", "8"], "6");
    expect(rec.best).toBe("double");
  });

  it("recommends splitting important pairs", () => {
    expect(recommend(["8", "8"], "10").best).toBe("split");
    expect(recommend(["A", "A"], "A").best).toBe("split");
  });

  it("stands on pair of nines versus seven", () => {
    const rec = recommend(["9", "9"], "7");
    expect(rec.best).toBe("stand");
  });

  it("never splits tens", () => {
    const rec = recommend(["10", "10"], "6");
    expect(rec.best).toBe("stand");
  });
});
