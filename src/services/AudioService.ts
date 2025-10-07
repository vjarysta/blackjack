import chipStackClassic from "../assets/audio/2 Card Playing FX2_1.wav";
import cardDealClassic from "../assets/audio/Card Deal 2.wav";
import cardFlipClassic from "../assets/audio/Card Slide 1.wav";
import insuranceCashClassic from "../assets/audio/Card Slide 2.wav";
import loseSwellClassic from "../assets/audio/Card Slap 3.wav";
import pushChimeClassic from "../assets/audio/Card Slap 2.wav";
import winFanfareClassic from "../assets/audio/Full deal 1.wav";
import noirButtonSoft from "../assets/audio/0 Card Playing FX2_3.wav";
import noirChipRemove from "../assets/audio/0Card Playing F2-1_6.wav";
import noirChipAdd from "../assets/audio/2Card Playing F2-1_8.wav";
import noirBustSoft from "../assets/audio/3Card Playing F2-1_3.wav";
import noirSplitSoft from "../assets/audio/4Card Playing F2-1_2.wav";
import noirLoseSoft from "../assets/audio/5Card Playing F2-1_5.wav";
import noirSurrenderSoft from "../assets/audio/6Card Playing F2-1_4.wav";
import noirNoticeSoft from "../assets/audio/7Card Playing F2-12_2.wav";
import noirWinSoft from "../assets/audio/8Card Playing F2-12_1.wav";
import noirNeutralSoft from "../assets/audio/8 Card Playing FX1_1.wav";
import noirInvalidSoft from "../assets/audio/9Card Playing F2-15_3.wav";
import noirDoubleSoft from "../assets/audio/1Card Playing F2-1_9.wav";
import noirShuffleSoft from "../assets/audio/Card Dealing FX 2.wav";

const noirDealSoft = cardFlipClassic;
const noirFlipSoft = insuranceCashClassic;
const noirBlackjackSoft = winFanfareClassic;

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export type SoundKey =
  | "deal"
  | "flip"
  | "button"
  | "chipAdd"
  | "chipRemove"
  | "shuffle"
  | "win"
  | "lose"
  | "push"
  | "bust"
  | "blackjack"
  | "double"
  | "split"
  | "surrender"
  | "insurancePrompt"
  | "insurance"
  | "invalid";

export type AudioTheme = "classic" | "noirjack";

export type ResultSound = "win" | "lose" | "push" | "blackjack" | "insurance";

interface SoundConfig {
  src: string;
  volume: number;
  cooldown?: number;
}

type SoundMap = Record<SoundKey, SoundConfig | null>;

const DEFAULT_COOLDOWN = 140;
const REDUCE_FACTOR = 0.35;
const STORAGE_KEY = "bj.audio.settings";
const DEFAULT_VOLUME = 0.55;

interface PersistedSettings {
  volume?: number;
  muted?: boolean;
  reduceAudio?: boolean;
}

export interface AudioState {
  theme: AudioTheme;
  muted: boolean;
  volume: number;
  reduceAudio: boolean;
  ready: boolean;
}

export interface AudioService {
  init(): void;
  play(key: SoundKey): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  setReduceAudio(enabled: boolean): void;
  setTheme(theme: AudioTheme): void;
  getTheme(): AudioTheme;
  isReady(): boolean;
  isMuted(): boolean;
  getVolume(): number;
  isReduceAudioEnabled(): boolean;
  subscribe(listener: (state: AudioState) => void): () => void;
  getState(): AudioState;
  playChip(): void;
  playCardDeal(): void;
  playCardFlip(): void;
  playResult(kind: ResultSound): void;
}

const SOUND_THEMES: Record<AudioTheme, SoundMap> = {
  classic: {
    deal: { src: cardDealClassic, volume: 0.35, cooldown: 120 },
    flip: { src: cardFlipClassic, volume: 0.35, cooldown: 200 },
    button: null,
    chipAdd: { src: chipStackClassic, volume: 0.45, cooldown: 180 },
    chipRemove: { src: chipStackClassic, volume: 0.45, cooldown: 180 },
    shuffle: { src: cardDealClassic, volume: 0.45, cooldown: 600 },
    win: { src: winFanfareClassic, volume: 0.5, cooldown: 600 },
    lose: { src: loseSwellClassic, volume: 0.55, cooldown: 600 },
    push: { src: pushChimeClassic, volume: 0.4, cooldown: 600 },
    bust: { src: loseSwellClassic, volume: 0.55, cooldown: 600 },
    blackjack: { src: winFanfareClassic, volume: 0.5, cooldown: 600 },
    double: null,
    split: null,
    surrender: null,
    insurancePrompt: { src: insuranceCashClassic, volume: 0.5, cooldown: 600 },
    insurance: { src: insuranceCashClassic, volume: 0.5, cooldown: 600 },
    invalid: null
  },
  noirjack: {
    deal: { src: noirDealSoft, volume: 0.32, cooldown: 120 },
    flip: { src: noirFlipSoft, volume: 0.32, cooldown: 220 },
    button: { src: noirButtonSoft, volume: 0.22, cooldown: 140 },
    chipAdd: { src: noirChipAdd, volume: 0.3, cooldown: 180 },
    chipRemove: { src: noirChipRemove, volume: 0.28, cooldown: 200 },
    shuffle: { src: noirShuffleSoft, volume: 0.34, cooldown: 700 },
    win: { src: noirWinSoft, volume: 0.38, cooldown: 700 },
    lose: { src: noirLoseSoft, volume: 0.32, cooldown: 700 },
    push: { src: noirNeutralSoft, volume: 0.28, cooldown: 700 },
    bust: { src: noirBustSoft, volume: 0.34, cooldown: 700 },
    blackjack: { src: noirBlackjackSoft, volume: 0.36, cooldown: 700 },
    double: { src: noirDoubleSoft, volume: 0.28, cooldown: 300 },
    split: { src: noirSplitSoft, volume: 0.26, cooldown: 300 },
    surrender: { src: noirSurrenderSoft, volume: 0.24, cooldown: 300 },
    insurancePrompt: { src: noirNoticeSoft, volume: 0.3, cooldown: 800 },
    insurance: { src: noirWinSoft, volume: 0.34, cooldown: 700 },
    invalid: { src: noirInvalidSoft, volume: 0.24, cooldown: 400 }
  }
};

class NoOpAudioService implements AudioService {
  private theme: AudioTheme = "classic";

  init(): void {}
  play(): void {}
  setMuted(): void {}
  setVolume(): void {}
  setReduceAudio(): void {}
  setTheme(theme: AudioTheme): void {
    this.theme = theme;
  }
  getTheme(): AudioTheme {
    return this.theme;
  }
  isReady(): boolean {
    return false;
  }
  isMuted(): boolean {
    return false;
  }
  getVolume(): number {
    return DEFAULT_VOLUME;
  }
  isReduceAudioEnabled(): boolean {
    return false;
  }
  subscribe(): () => void {
    return () => {};
  }
  getState(): AudioState {
    return {
      theme: this.theme,
      muted: false,
      volume: DEFAULT_VOLUME,
      reduceAudio: false,
      ready: false
    };
  }
  playChip(): void {}
  playCardDeal(): void {}
  playCardFlip(): void {}
  playResult(kind: ResultSound): void {
    void kind;
  }
}

class BrowserAudioService implements AudioService {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private theme: AudioTheme = "classic";
  private muted: boolean;
  private volume: number;
  private reduceAudio: boolean;
  private ready = false;
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly loadingBuffers = new Map<string, Promise<AudioBuffer | null>>();
  private readonly lastPlayedAt = new Map<SoundKey, number>();
  private readonly listeners = new Set<(state: AudioState) => void>();

  constructor() {
    const persisted = this.loadSettings();
    this.volume = clampVolume(persisted?.volume ?? DEFAULT_VOLUME);
    this.muted = persisted?.muted ?? false;
    this.reduceAudio = persisted?.reduceAudio ?? false;
  }

  init(): void {
    if (!this.ensureContext()) {
      return;
    }
    if (this.context && this.context.state === "suspended") {
      void this.context.resume();
    }
    if (!this.ready) {
      this.ready = true;
      this.preloadTheme(this.theme);
      this.emit();
    }
  }

  play(key: SoundKey): void {
    if (!this.ready || this.muted || this.volume <= 0) {
      return;
    }
    if (!this.ensureContext() || !this.context) {
      return;
    }
    if (this.context.state === "suspended") {
      void this.context.resume();
    }
    const config = SOUND_THEMES[this.theme][key];
    if (!config || config.volume <= 0) {
      return;
    }
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const cooldown = config.cooldown ?? DEFAULT_COOLDOWN;
    const last = this.lastPlayedAt.get(key);
    if (last !== undefined && now - last < cooldown) {
      return;
    }
    const playBuffer = (buffer: AudioBuffer | null): void => {
      if (!buffer || !this.context || !this.masterGain || this.muted || this.volume <= 0) {
        return;
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      const gainNode = this.context.createGain();
      gainNode.gain.value = clampVolume(config.volume);
      source.connect(gainNode);
      gainNode.connect(this.masterGain);
      source.start();
      this.lastPlayedAt.set(key, now);
    };
    const cached = this.buffers.get(config.src);
    if (cached) {
      playBuffer(cached);
      return;
    }
    void this.loadBuffer(config.src).then(playBuffer).catch(() => {
      this.lastPlayedAt.delete(key);
    });
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.persistSettings();
    if (this.context) {
      if (muted) {
        void this.context.suspend().catch(() => {});
      } else if (this.ready) {
        void this.context.resume().catch(() => {});
      }
    }
    this.updateMasterGain();
    this.emit();
  }

  setVolume(volume: number): void {
    this.volume = clampVolume(volume);
    this.persistSettings();
    this.updateMasterGain();
    this.emit();
  }

  setReduceAudio(enabled: boolean): void {
    this.reduceAudio = enabled;
    this.persistSettings();
    this.updateMasterGain();
    this.emit();
  }

  setTheme(theme: AudioTheme): void {
    if (this.theme === theme) {
      return;
    }
    this.theme = theme;
    if (this.ready) {
      this.preloadTheme(theme);
    }
    this.emit();
  }

  getTheme(): AudioTheme {
    return this.theme;
  }

  isReady(): boolean {
    return this.ready;
  }

  isMuted(): boolean {
    return this.muted;
  }

  getVolume(): number {
    return this.volume;
  }

  isReduceAudioEnabled(): boolean {
    return this.reduceAudio;
  }

  subscribe(listener: (state: AudioState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AudioState {
    return {
      theme: this.theme,
      muted: this.muted,
      volume: this.volume,
      reduceAudio: this.reduceAudio,
      ready: this.ready
    };
  }

  playChip(): void {
    this.play("chipAdd");
  }

  playCardDeal(): void {
    this.play("deal");
  }

  playCardFlip(): void {
    this.play("flip");
  }

  playResult(kind: ResultSound): void {
    if (kind === "blackjack") {
      this.play("blackjack");
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

  private ensureContext(): boolean {
    if (this.context) {
      return true;
    }
    if (typeof window === "undefined") {
      return false;
    }
    const ContextCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!ContextCtor) {
      return false;
    }
    const context = new ContextCtor();
    const masterGain = context.createGain();
    masterGain.connect(context.destination);
    this.context = context;
    this.masterGain = masterGain;
    this.updateMasterGain();
    return true;
  }

  private preloadTheme(theme: AudioTheme): void {
    const soundMap = SOUND_THEMES[theme];
    for (const config of Object.values(soundMap)) {
      if (config) {
        void this.loadBuffer(config.src);
      }
    }
  }

  private async loadBuffer(src: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(src)) {
      return this.buffers.get(src) ?? null;
    }
    const existing = this.loadingBuffers.get(src);
    if (existing) {
      return existing;
    }
    const promise = (async () => {
      if (!this.context) {
        return null;
      }
      const response = await fetch(src);
      if (!response.ok) {
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      if (!this.context) {
        return null;
      }
      const buffer = await this.context.decodeAudioData(arrayBuffer.slice(0));
      this.buffers.set(src, buffer);
      this.loadingBuffers.delete(src);
      return buffer;
    })().catch(() => {
      this.loadingBuffers.delete(src);
      return null;
    });
    this.loadingBuffers.set(src, promise);
    return promise;
  }

  private loadSettings(): PersistedSettings | null {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }
      return JSON.parse(stored) as PersistedSettings;
    } catch (error) {
      void error;
      return null;
    }
  }

  private persistSettings(): void {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const payload: PersistedSettings = {
        volume: this.volume,
        muted: this.muted,
        reduceAudio: this.reduceAudio
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      void error;
    }
  }

  private emit(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private updateMasterGain(): void {
    if (!this.context || !this.masterGain) {
      return;
    }
    const effective = this.muted ? 0 : clampVolume(this.volume * (this.reduceAudio ? REDUCE_FACTOR : 1));
    this.masterGain.gain.setTargetAtTime(effective, this.context.currentTime, 0.01);
  }
}

const clampVolume = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
};

const isBrowser = typeof window !== "undefined";

export const audioService: AudioService = isBrowser ? new BrowserAudioService() : new NoOpAudioService();

