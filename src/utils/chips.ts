import type { ChipDenomination } from "../theme/palette";

export type Denomination = ChipDenomination;

const DEFAULT_DENOMS: Denomination[] = [500, 100, 25, 5, 1];

export function makeChange(amount: number, denoms: Denomination[] = DEFAULT_DENOMS): Denomination[] {
  const out: Denomination[] = [];
  let rest = Math.max(0, Math.floor(amount));
  for (const denom of denoms) {
    while (rest >= denom) {
      out.push(denom);
      rest -= denom;
    }
  }
  return out;
}

export function diffStacks(prev: Denomination[], next: Denomination[]): {
  add: Denomination[];
  remove: Denomination[];
} {
  const add: Denomination[] = [];
  const remove: Denomination[] = [];

  const order = DEFAULT_DENOMS;
  const count = (stack: Denomination[]): Record<Denomination, number> => {
    const result = {
      1: 0,
      5: 0,
      25: 0,
      100: 0,
      500: 0
    } as Record<Denomination, number>;
    for (const denom of stack) {
      result[denom] += 1;
    }
    return result;
  };

  const prevCounts = count(prev);
  const nextCounts = count(next);

  for (const denom of order) {
    const delta = nextCounts[denom] - prevCounts[denom];
    if (delta > 0) {
      for (let i = 0; i < delta; i += 1) {
        add.push(denom);
      }
    } else if (delta < 0) {
      for (let i = 0; i < -delta; i += 1) {
        remove.push(denom);
      }
    }
  }

  return { add, remove };
}
