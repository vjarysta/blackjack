import { Howl } from "howler";
import chipStack from "../assets/audio/2 Card Playing FX2_1.wav";
import cardDeal from "../assets/audio/Card Deal 2.wav";
import cardFlip from "../assets/audio/Card Slide 1.wav";
import insuranceCash from "../assets/audio/Card Slide 2.wav";
import loseSwell from "../assets/audio/Card Slap 3.wav";
import pushChime from "../assets/audio/Card Slap 2.wav";
import winFanfare from "../assets/audio/Full deal 1.wav";

type ResultSound = "win" | "lose" | "push" | "blackjack" | "insurance";

export interface AudioService {
  playChip(): void;
  playCardDeal(): void;
  playCardFlip(): void;
  playResult(kind: ResultSound): void;
}

class NoOpAudioService implements AudioService {
  playChip(): void {}
  playCardDeal(): void {}
  playCardFlip(): void {}
  playResult(kind: ResultSound): void {
    void kind;
  }
}

const createHowl = (src: string, volume: number): Howl =>
  new Howl({ src: [src], volume, preload: true, html5: false });

type SoundKey = "chip" | "deal" | "flip" | "win" | "lose" | "push" | "insurance";

class HowlerAudioService implements AudioService {
  private readonly sounds: Record<SoundKey, Howl>;

  constructor() {
    this.sounds = {
      chip: createHowl(chipStack, 0.45),
      deal: createHowl(cardDeal, 0.35),
      flip: createHowl(cardFlip, 0.35),
      win: createHowl(winFanfare, 0.5),
      lose: createHowl(loseSwell, 0.55),
      push: createHowl(pushChime, 0.4),
      insurance: createHowl(insuranceCash, 0.5)
    };
  }

  private play(name: SoundKey): void {
    const sound = this.sounds[name];
    if (!sound) {
      return;
    }
    if (sound.playing()) {
      sound.stop();
    }
    sound.play();
  }

  playChip(): void {
    this.play("chip");
  }

  playCardDeal(): void {
    this.play("deal");
  }

  playCardFlip(): void {
    this.play("flip");
  }

  playResult(kind: ResultSound): void {
    if (kind === "blackjack") {
      // TODO: Replace with a dedicated blackjack sting once we find one.
      this.play("win");
      return;
    }
    if (kind === "win") {
      this.play("win");
      return;
    }
    if (kind === "insurance") {
      this.play("insurance");
      return;
    }
    if (kind === "push") {
      this.play("push");
      return;
    }
    this.play("lose");
  }
}

const isBrowser = typeof window !== "undefined";

export const audioService: AudioService = isBrowser ? new HowlerAudioService() : new NoOpAudioService();
