type ResultSound = "win" | "lose" | "push" | "blackjack" | "insurance";

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
  | "invalid";

export interface SoundDefinition {
  src: string;
  volume?: number;
}

export interface SoundProfile {
  id: string;
  sounds: Partial<Record<SoundKey, SoundDefinition>>;
  defaultVolume?: number;
}

export interface AudioSnapshot {
  muted: boolean;
  volume: number;
  reduced: boolean;
  ready: boolean;
}

export interface AudioService {
  init(): void;
  play(key: SoundKey): void;
  playChip(): void;
  playCardDeal(): void;
  playCardFlip(): void;
  playResult(kind: ResultSound): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  setReduceAudio(enabled: boolean): void;
  isReady(): boolean;
  isMuted(): boolean;
  isReduced(): boolean;
  getVolume(): number;
  useProfile(profile: SoundProfile): void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): AudioSnapshot;
}

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

interface PersistedSettings {
  muted: boolean;
  volume: number;
  reduced: boolean;
}

const STORAGE_KEY = "blackjack.audio";
const REDUCED_MULTIPLIER = 0.35;
const MIN_INTERVAL_MS = 120;

class NoOpAudioService implements AudioService {
  init(): void {}
  play(): void {}
  playChip(): void {}
  playCardDeal(): void {}
  playCardFlip(): void {}
  playResult(kind: ResultSound): void {
    void kind;
  }
  setMuted(): void {}
  setVolume(): void {}
  setReduceAudio(): void {}
  isReady(): boolean {
    return false;
  }
  isMuted(): boolean {
    return true;
  }
  isReduced(): boolean {
    return false;
  }
  getVolume(): number {
    return 0;
  }
  useProfile(): void {}
  subscribe(): () => void {
    return () => {};
  }
  getSnapshot(): AudioSnapshot {
    return { muted: true, volume: 0, reduced: false, ready: false };
  }
}

class BrowserAudioService implements AudioService {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private readonly buffers = new Map<SoundKey, AudioBuffer>();
  private readonly loading = new Map<SoundKey, Promise<AudioBuffer | null>>();
  private readonly cooldowns = new Map<SoundKey, number>();
  private readonly listeners = new Set<() => void>();
  private profile: SoundProfile | null = null;
  private ready = false;
  private muted: boolean;
  private volume: number;
  private reduced: boolean;
  private hasCustomVolume: boolean;

  constructor() {
    const persisted = this.readSettings();
    this.muted = persisted?.muted ?? false;
    this.volume = clamp(persisted?.volume ?? 0.65, 0, 1);
    this.reduced = persisted?.reduced ?? false;
    this.hasCustomVolume = typeof persisted?.volume === "number";
  }

  private readSettings(): PersistedSettings | null {
    if (!isBrowser) {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
      if (typeof parsed !== "object" || parsed === null) {
        return null;
      }
      return {
        muted: Boolean(parsed.muted),
        volume: typeof parsed.volume === "number" ? parsed.volume : 0.65,
        reduced: Boolean(parsed.reduced)
      };
    } catch (error) {
      console.warn("Failed to parse audio settings", error);
      return null;
    }
  }

  private persistSettings(): void {
    if (!isBrowser) {
      return;
    }
    const payload: PersistedSettings = {
      muted: this.muted,
      volume: this.volume,
      reduced: this.reduced
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to persist audio settings", error);
    }
  }

  private ensureContext(): void {
    if (this.context || !isBrowser) {
      return;
    }
    const context = new AudioContext();
    const gain = context.createGain();
    gain.connect(context.destination);
    this.context = context;
    this.masterGain = gain;
    this.updateGain();
  }

  private updateGain(): void {
    if (!this.masterGain) {
      return;
    }
    const multiplier = this.reduced ? REDUCED_MULTIPLIER : 1;
    this.masterGain.gain.value = this.muted ? 0 : this.volume * multiplier;
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private getNow(): number {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  private async loadBuffer(key: SoundKey, definition: SoundDefinition): Promise<AudioBuffer | null> {
    if (!this.context) {
      return null;
    }
    try {
      const response = await fetch(definition.src);
      if (!response.ok) {
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(key, buffer);
      return buffer;
    } catch (error) {
      console.warn(`Failed to load sound: ${key}`, error);
      return null;
    }
  }

  private async preloadAll(): Promise<void> {
    if (!this.profile || !this.context) {
      return;
    }
    const entries = Object.entries(this.profile.sounds) as [SoundKey, SoundDefinition][];
    await Promise.all(
      entries.map(async ([key, definition]) => {
        if (!definition || this.buffers.has(key)) {
          return;
        }
        const existing = this.loading.get(key);
        if (existing) {
          await existing;
          return;
        }
        const loader = this.loadBuffer(key, definition);
        this.loading.set(key, loader);
        await loader;
        this.loading.delete(key);
      })
    );
  }

  private playBuffer(key: SoundKey, buffer: AudioBuffer, definition: SoundDefinition): void {
    if (!this.context || !this.masterGain) {
      return;
    }
    const now = this.getNow();
    const lastPlay = this.cooldowns.get(key) ?? 0;
    if (now - lastPlay < MIN_INTERVAL_MS) {
      return;
    }
    this.cooldowns.set(key, now);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const gainNode = this.context.createGain();
    gainNode.gain.value = definition.volume ?? 1;
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start();
  }

  init(): void {
    if (!isBrowser) {
      return;
    }
    this.ensureContext();
    if (!this.context) {
      return;
    }
    const resume = (): void => {
      this.ready = true;
      this.notify();
      void this.preloadAll();
    };
    if (this.context.state === "suspended") {
      void this.context
        .resume()
        .then(resume)
        .catch((error) => {
          console.warn("Audio context resume failed", error);
        });
      return;
    }
    resume();
  }

  play(key: SoundKey): void {
    if (!this.ready || this.muted || !this.profile) {
      return;
    }
    const definition = this.profile.sounds[key];
    if (!definition) {
      return;
    }
    const buffer = this.buffers.get(key);
    if (buffer) {
      this.playBuffer(key, buffer, definition);
      return;
    }
    const loader = this.loading.get(key);
    if (loader) {
      void loader.then((loaded) => {
        if (!loaded) {
          return;
        }
        this.playBuffer(key, loaded, definition);
      });
      return;
    }
    const promise = this.loadBuffer(key, definition);
    this.loading.set(key, promise);
    void promise.then((loaded) => {
      this.loading.delete(key);
      if (!loaded) {
        return;
      }
      this.playBuffer(key, loaded, definition);
    });
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
    if (kind === "insurance") {
      this.play("insurancePrompt");
      return;
    }
    this.play(kind);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.updateGain();
    this.persistSettings();
    this.notify();
  }

  setVolume(volume: number): void {
    const clamped = clamp(volume, 0, 1);
    this.volume = clamped;
    this.hasCustomVolume = true;
    this.updateGain();
    this.persistSettings();
    this.notify();
  }

  setReduceAudio(enabled: boolean): void {
    this.reduced = enabled;
    this.updateGain();
    this.persistSettings();
    this.notify();
  }

  isReady(): boolean {
    return this.ready;
  }

  isMuted(): boolean {
    return this.muted;
  }

  isReduced(): boolean {
    return this.reduced;
  }

  getVolume(): number {
    return this.volume;
  }

  useProfile(profile: SoundProfile): void {
    this.profile = profile;
    if (!this.hasCustomVolume && typeof profile.defaultVolume === "number") {
      this.volume = clamp(profile.defaultVolume, 0, 1);
      this.updateGain();
      this.notify();
    }
    if (this.ready) {
      void this.preloadAll();
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): AudioSnapshot {
    return {
      muted: this.muted,
      volume: this.volume,
      reduced: this.reduced,
      ready: this.ready
    };
  }
}

export const audioService: AudioService = isBrowser ? new BrowserAudioService() : new NoOpAudioService();
