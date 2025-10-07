import { describe, expect, it } from "vitest";
import { defaultRuleConfig } from "../src/engine/rules.config";
import type { RuleConfig } from "../src/engine/types";
import type { PlayerContext, Recommendation, Action } from "../src/utils/basicStrategy";
import { getRecommendation } from "../src/utils/basicStrategy";

const cloneRules = (overrides: Partial<RuleConfig> = {}): RuleConfig => ({
  ...defaultRuleConfig,
  ...overrides
});

const buildContext = (
  cards: string[],
  dealer: "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K",
  legalOverrides: Partial<PlayerContext["legal"]> = {},
  extras: Partial<Pick<PlayerContext, "isInitialTwoCards" | "afterSplit">> = {}
): PlayerContext => ({
  dealerUpcard: { rank: dealer },
  cards: cards.map((rank) => ({ rank })),
  isInitialTwoCards: extras.isInitialTwoCards ?? cards.length === 2,
  afterSplit: extras.afterSplit ?? false,
  legal: {
    hit: true,
    stand: true,
    double: true,
    split: false,
    surrender: true,
    ...legalOverrides
  }
});

const resolvedAction = (rec: Recommendation, legal: PlayerContext["legal"]): Action => {
  const preferred = rec.best;
  if (preferred === "surrender" && !legal.surrender) {
    return rec.fallback ?? "hit";
  }
  if (preferred === "split" && !legal.split) {
    return rec.fallback ?? "hit";
  }
  if (preferred === "double" && !legal.double) {
    return rec.fallback ?? "hit";
  }
  if (preferred === "hit" && !legal.hit) {
    return rec.fallback ?? "stand";
  }
  if (preferred === "stand" && !legal.stand) {
    return rec.fallback ?? "hit";
  }
  if (preferred === "double" && rec.fallback && !legal.double) {
    return rec.fallback;
  }
  return legal[preferred as keyof typeof legal] ? preferred : rec.fallback ?? preferred;
};

describe("basic strategy recommendations", () => {
  it("suggests surrender on hard 16 vs 10 when allowed", () => {
    const ctx = buildContext(["10", "6"], "10");
    const rec = getRecommendation(ctx, defaultRuleConfig);
    expect(rec.best).toBe("surrender");
    expect(rec.fallback).toBe("hit");
  });

  it("suggests hitting hard 12 vs 3", () => {
    const ctx = buildContext(["9", "3"], "3");
    const rec = getRecommendation(ctx, defaultRuleConfig);
    expect(rec.best).toBe("hit");
  });

  it("suggests hitting hard 11 vs Ace under S17 rules", () => {
    const ctx = buildContext(["5", "6"], "A");
    const rec = getRecommendation(ctx, defaultRuleConfig);
    expect(rec.best).toBe("hit");
  });

  it("suggests doubling hard 9 vs 3", () => {
    const ctx = buildContext(["4", "5"], "3");
    const rec = getRecommendation(ctx, defaultRuleConfig);
    expect(rec.best).toBe("double");
    expect(rec.fallback).toBe("hit");
  });

  it("suggests hitting soft 18 vs 9", () => {
    const ctx = buildContext(["A", "7"], "9");
    const rec = getRecommendation(ctx, defaultRuleConfig);
    expect(rec.best).toBe("hit");
  });

  it("suggests doubling soft 19 vs 6", () => {
    const ctx = buildContext(["A", "8"], "6");
    const rec = getRecommendation(ctx, defaultRuleConfig);
    expect(rec.best).toBe("double");
    expect(rec.fallback).toBe("stand");
  });

  it("splits eights against ten", () => {
    const ctx = buildContext(["8", "8"], "10", { split: true });
    const rec = getRecommendation(ctx, defaultRuleConfig);
    expect(rec.best).toBe("split");
  });

  it("splits aces against ace", () => {
    const ctx = buildContext(["A", "A"], "A", { split: true });
    const rec = getRecommendation(ctx, defaultRuleConfig);
    expect(rec.best).toBe("split");
  });

  it("stands on nines vs seven", () => {
    const ctx = buildContext(["9", "9"], "7", { split: true });
    const rec = getRecommendation(ctx, defaultRuleConfig);
    expect(rec.best).toBe("stand");
  });

  it("never splits tens", () => {
    const ctx = buildContext(["10", "10"], "6", { split: true });
    const rec = getRecommendation(ctx, defaultRuleConfig);
    expect(rec.best).toBe("stand");
  });

  it("doubles hard 11 vs Ace on H17 tables", () => {
    const ctx = buildContext(["5", "6"], "A");
    const rules = cloneRules({ dealerStandsOnSoft17: false });
    const rec = getRecommendation(ctx, rules);
    expect(rec.best).toBe("double");
  });

  it("falls back when surrender is unavailable", () => {
    const ctx = buildContext(["10", "6"], "10", { surrender: false });
    const rules = cloneRules({ surrender: "none" });
    const rec = getRecommendation(ctx, rules);
    expect(resolvedAction(rec, ctx.legal)).not.toBe("surrender");
  });
});
