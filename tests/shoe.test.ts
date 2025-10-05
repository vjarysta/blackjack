import { describe, expect, it } from "vitest";
import { createShoe, drawCard, discard, reshuffleIfNeeded } from "../src/engine/shoe";

describe("shoe", () => {
  it("creates correct number of cards", () => {
    const shoe = createShoe(6, 0.75);
    expect(shoe.cards.length).toBe(52 * 6);
  });

  it("flags reshuffle when cut card reached", () => {
    let shoe = createShoe(1, 0.5);
    const initialLength = shoe.cards.length;
    for (let i = 0; i < initialLength / 2 + 1; i += 1) {
      drawCard(shoe);
    }
    expect(shoe.needsReshuffle).toBe(true);
    shoe = reshuffleIfNeeded(shoe, 1, 0.5);
    expect(shoe.cards.length).toBe(52);
    expect(shoe.needsReshuffle).toBe(false);
  });

  it("collects discards", () => {
    const shoe = createShoe(1, 0.5);
    const first = drawCard(shoe);
    discard(shoe, [first]);
    expect(shoe.discard).toHaveLength(1);
  });
});
