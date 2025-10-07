import { REDUCED } from "../utils/animConstants";

type SoundKey =
  | "cardDeal"
  | "chipStack"
  | "cardFlip"
  | "roundWin"
  | "roundLose"
  | "roundPush"
  | "roundBlackjack"
  | "roundInsurance";

type SoundDefinition = {
  params: readonly number[];
};

const SOUND_LIBRARY: Record<SoundKey, SoundDefinition> = {
  cardDeal: {
    params: [
      undefined,
      undefined,
      650,
      0.02,
      0.04,
      0.08,
      1,
      1.3,
      undefined,
      4.4,
    ],
  },
  chipStack: {
    params: [1.2, 0.35, 1700, 0, 0.02, 0.08, 1, 2.3, undefined, 6.8],
  },
  cardFlip: {
    params: [
      undefined,
      undefined,
      720,
      0.01,
      0.03,
      0.08,
      1,
      1.6,
      undefined,
      5.4,
      undefined,
      undefined,
      -0.01,
      undefined,
      0.02,
      0.02,
    ],
  },
  roundWin: {
    params: [
      undefined,
      undefined,
      925,
      0.04,
      0.3,
      0.6,
      1,
      0.3,
      undefined,
      6.27,
      -184,
      0.09,
      0.17,
    ],
  },
  roundBlackjack: {
    params: [
      undefined,
      undefined,
      1040,
      0.05,
      0.24,
      0.62,
      1,
      0.48,
      undefined,
      5.9,
      -280,
      0.09,
      0.2,
    ],
  },
  roundLose: {
    params: [
      undefined,
      undefined,
      130,
      0.03,
      0.3,
      0.4,
      1,
      0.52,
      -6.7,
      undefined,
      2,
      0.07,
      0.17,
    ],
  },
  roundPush: {
    params: [
      undefined,
      undefined,
      250,
      0.02,
      0.2,
      0.2,
      0,
      2,
      undefined,
      4.3,
      undefined,
      undefined,
      -0.01,
      undefined,
      0.05,
    ],
  },
  roundInsurance: {
    // TODO: Replace with a bespoke insurance resolution effect once a better sample is available.
    params: [
      undefined,
      undefined,
      925,
      0.04,
      0.3,
      0.6,
      1,
      0.3,
      undefined,
      6.27,
      -184,
      0.09,
      0.17,
    ],
  },
};

const hasWindow = typeof window !== "undefined";

type ZzfxModule = typeof import("zzfx");

let cachedModule: ZzfxModule | null = null;
let loadPromise: Promise<ZzfxModule | null> | null = null;

const ensureModule = (): Promise<ZzfxModule | null> => {
  if (cachedModule) {
    return Promise.resolve(cachedModule);
  }
  if (!hasWindow || REDUCED) {
    return Promise.resolve(null);
  }
  if (!loadPromise) {
    loadPromise = import("zzfx")
      .then((module) => {
        module.ZZFX.volume = 0.25;
        return module;
      })
      .then((module) => {
        cachedModule = module;
        return module;
      })
      .catch(() => null);
  }
  return loadPromise;
};

const resumeContext = (module: ZzfxModule): void => {
  try {
    const context = module.ZZFX.audioContext;
    if (context?.state === "suspended") {
      void context.resume();
    }
  } catch {
    // ignore resume errors
  }
};

export const playSound = (key: SoundKey): void => {
  const definition = SOUND_LIBRARY[key];
  if (!definition) {
    return;
  }
  void ensureModule().then((module) => {
    if (!module) {
      return;
    }
    resumeContext(module);
    module.zzfx(...definition.params);
  });
};

export const preloadSoundscape = (): void => {
  void ensureModule();
};
