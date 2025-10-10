import { type SoundProfile } from "./AudioService";
import shuffleSoft from "../assets/audio/Card Dealing FX 2.wav";
import dealSoft from "../assets/audio/Card Slide 1.wav";
import flipSoft from "../assets/audio/Card Slide 2.wav";
import buttonTap from "../assets/audio/0Card Playing F2-1_6.wav";
import chipSoftAdd from "../assets/audio/2 Card Playing FX2_1.wav";
import chipSoftRemove from "../assets/audio/3Card Playing F2-1_3.wav";
import winSoft from "../assets/audio/Card Deal 3.wav";
import loseSoft from "../assets/audio/Card Slap 3-2.wav";
import pushSoft from "../assets/audio/Card Deal 5.wav";
import bustSoft from "../assets/audio/Card Slap 1.wav";
import blackjackSoft from "../assets/audio/Card Deal 6.wav";
import doubleSoft from "../assets/audio/5 Card Playing FX2_8.wav";
import splitSoft from "../assets/audio/3 Card Playing FX2_2.wav";
import surrenderSoft from "../assets/audio/1 Card Playing FX2_4.wav";
import insuranceSoft from "../assets/audio/Card Dealing FX 1.wav";
import invalidSoft from "../assets/audio/0 Card Playing FX2_3.wav";
import celebrationBurst from "../assets/audio/Card Deal 4.wav"; // TODO: Replace with a proper fireworks SFX (soft layered "whoosh + pop")

export const noirSoundProfile: SoundProfile = {
  id: "noirjack",
  defaultVolume: 0.55,
  sounds: {
    deal: { src: dealSoft, volume: 0.38 },
    flip: { src: flipSoft, volume: 0.32 },
    button: { src: buttonTap, volume: 0.3 },
    chipAdd: { src: chipSoftAdd, volume: 0.32 },
    chipRemove: { src: chipSoftRemove, volume: 0.28 },
    shuffle: { src: shuffleSoft, volume: 0.48 },
    win: { src: winSoft, volume: 0.44 },
    lose: { src: loseSoft, volume: 0.38 },
    push: { src: pushSoft, volume: 0.36 },
    bust: { src: bustSoft, volume: 0.4 },
    blackjack: { src: blackjackSoft, volume: 0.46 },
    double: { src: doubleSoft, volume: 0.34 },
    split: { src: splitSoft, volume: 0.32 },
    surrender: { src: surrenderSoft, volume: 0.3 },
    insurancePrompt: { src: insuranceSoft, volume: 0.32 },
    invalid: { src: invalidSoft, volume: 0.28 },
    celebration: { src: celebrationBurst, volume: 0.45 }
  }
};
