import { describe, expect, it } from "vitest";
import { computeCardMetrics } from "../../src/components/noirjack/hooks/useCardMetrics";

describe("computeCardMetrics", () => {
  it("limits card width when viewport height is tight", () => {
    const metrics = computeCardMetrics(480, { width: 480, height: 520 });
    expect(metrics.width).toBeLessThanOrEqual(Math.round((520 * 0.28) / 1.4));
    expect(metrics.height).toBe(Math.round(metrics.width * 1.4));
  });

  it("clamps card width to the maximum when space allows", () => {
    const metrics = computeCardMetrics(800, { width: 800, height: 1080 });
    expect(metrics.width).toBe(132);
    expect(metrics.height).toBe(Math.round(132 * 1.4));
  });

  it("never goes below the minimum card width", () => {
    const metrics = computeCardMetrics(120, { width: 120, height: 400 });
    expect(metrics.width).toBeGreaterThanOrEqual(64);
  });
});
