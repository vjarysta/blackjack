import React from "react";
import { Volume2, VolumeX, AudioWaveform } from "lucide-react";
import { audioService } from "../../services/AudioService";

export const NoirSoundControls: React.FC = () => {
  const subscribe = React.useCallback((listener: () => void) => audioService.subscribe(listener), []);
  const getSnapshot = React.useCallback(() => audioService.getSnapshot(), []);
  const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const muteLabel = snapshot.muted ? "Unmute" : "Mute";
  const toggleMute = React.useCallback(() => {
    audioService.setMuted(!snapshot.muted);
  }, [snapshot.muted]);

  const handleVolumeChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(next)) {
      return;
    }
    audioService.setVolume(next / 100);
  }, []);

  const toggleReduce = React.useCallback(() => {
    audioService.setReduceAudio(!snapshot.reduced);
  }, [snapshot.reduced]);

  return (
    <div className="nj-sound-controls nj-glass">
      <button
        type="button"
        className="nj-btn nj-btn--ghost nj-sound-controls__mute"
        onClick={toggleMute}
        aria-pressed={snapshot.muted}
        title={muteLabel}
        aria-label={muteLabel}
      >
        {snapshot.muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
      </button>
      <div className="nj-sound-controls__slider">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(snapshot.volume * 100)}
          onChange={handleVolumeChange}
          aria-label="Volume"
          title="Volume"
        />
      </div>
      <button
        type="button"
        className="nj-btn nj-btn--ghost nj-sound-controls__reduce"
        onClick={toggleReduce}
        aria-pressed={snapshot.reduced}
        title="Reduce audio"
        aria-label="Reduce audio"
      >
        <AudioWaveform size={16} aria-hidden="true" />
      </button>
    </div>
  );
};
