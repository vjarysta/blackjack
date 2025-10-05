import { describe, expect, it } from "vitest";
import { createShoe, drawCard, needsReshuffle, reshuffle } from "../src/engine/shoe";
import { NUMBER_OF_DECKS, defaultRules } from "../src/engine/rules.config";

describe("shoe", () => {
  it("creates the correct number of cards", () => {
    const shoe = createShoe(NUMBER_OF_DECKS, defaultRules.penetration);
    expect(shoe.cards.length + shoe.discard.length).toBe(NUMBER_OF_DECKS * 52);
  });

  it("draws and reshuffles when penetration reached", () => {
    const shoe = createShoe(1, 0.5);
    const originalLength = shoe.cards.length;
    for (let i = 0; i < originalLength - shoe.cutIndex; i += 1) {
      drawCard(shoe);
    }
    expect(needsReshuffle(shoe)).toBe(true);
    const reshuffled = reshuffle(shoe, 1, 0.5);
    expect(reshuffled.cards.length).toBe(originalLength);
  });
});
