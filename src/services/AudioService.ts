export interface AudioService {
  playChip(): void;
  playCard(): void;
  playWin(): void;
}

class NoOpAudioService implements AudioService {
  playChip(): void {}
  playCard(): void {}
  playWin(): void {}
}

export const audioService: AudioService = new NoOpAudioService();
