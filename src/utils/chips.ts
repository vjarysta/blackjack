export type Denom = 1 | 5 | 25 | 100 | 500;

const DEFAULT_DENOMS: ReadonlyArray<Denom> = [500, 100, 25, 5, 1];

/**
 * Greedy coin change for canonical Euro chip denominations. Returns the set ordered
 * from largest to smallest value.
 */
export const makeChange = (
  amount: number,
  denoms: ReadonlyArray<Denom> = DEFAULT_DENOMS
): Denom[] => {
  const output: Denom[] = [];
  const ordered = [...denoms].sort((a, b) => b - a) as Denom[];
  let rest = Math.max(0, Math.floor(amount));
  for (const denom of ordered) {
    while (rest >= denom) {
      output.push(denom);
      rest -= denom;
    }
  }
  return output;
};

export interface StackDiff {
  add: Denom[];
  remove: Denom[];
}

/**
 * Produces the multiset difference required to reconcile the previous stack with the
 * next stack. Both stacks are treated as unordered multisets.
 */
export const diffStacks = (prev: Denom[], next: Denom[]): StackDiff => {
  const prevCounts = new Map<Denom, number>();
  for (const value of prev) {
    prevCounts.set(value, (prevCounts.get(value) ?? 0) + 1);
  }

  const additions: Denom[] = [];
  for (const value of next) {
    const existing = prevCounts.get(value) ?? 0;
    if (existing > 0) {
      prevCounts.set(value, existing - 1);
    } else {
      additions.push(value);
    }
  }

  const removals: Denom[] = [];
  for (const [value, remaining] of prevCounts) {
    for (let index = 0; index < remaining; index += 1) {
      removals.push(value);
    }
  }

  return { add: additions, remove: removals };
};

export interface ChipItem {
  id: string;
  value: Denom;
}

/**
 * Reconciles the previous rendered chip items with the next values, reusing existing
 * identifiers whenever possible to minimise DOM churn and jitter.
 */
export const reconcileChipItems = (
  previous: ChipItem[],
  nextValues: Denom[],
  createId: () => string
): ChipItem[] => {
  const pool = new Map<Denom, ChipItem[]>();
  previous.forEach((item) => {
    const bucket = pool.get(item.value);
    if (bucket) {
      bucket.push(item);
    } else {
      pool.set(item.value, [item]);
    }
  });

  return nextValues.map((value) => {
    const bucket = pool.get(value);
    if (bucket && bucket.length > 0) {
      return bucket.pop()!;
    }
    return { id: createId(), value };
  });
};
