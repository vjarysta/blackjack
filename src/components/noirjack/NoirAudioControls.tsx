import React from "react";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import { audioService } from "../../services/AudioService";

const useAudioState = () =>
  React.useSyncExternalStore(
    (notify) => audioService.subscribe(() => notify()),
    () => audioService.getState(),
    () => audioService.getState()
  );

export const NoirAudioControls: React.FC = () => {
  const { muted, volume, reduceAudio } = useAudioState();
  const sliderValue = Math.round(volume * 100);
  const volumeIcon = React.useMemo(() => {
    if (muted || sliderValue === 0) {
      return <VolumeX size={16} aria-hidden="true" />;
    }
    if (sliderValue < 55) {
      return <Volume1 size={16} aria-hidden="true" />;
    }
    return <Volume2 size={16} aria-hidden="true" />;
  }, [muted, sliderValue]);

  const handleMuteToggle = () => {
    audioService.setMuted(!muted);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.currentTarget.value) / 100;
    audioService.setVolume(next);
  };

  const handleReduceToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    audioService.setReduceAudio(event.currentTarget.checked);
  };

  return (
    <div className="nj-audio nj-glass" role="group" aria-label="Sound settings">
      <button
        type="button"
        className="nj-btn nj-btn--ghost nj-audio__mute"
        onClick={handleMuteToggle}
        aria-label={muted ? "Unmute" : "Mute"}
        title={muted ? "Unmute" : "Mute"}
        aria-pressed={muted}
      >
        {volumeIcon}
      </button>
      <label className="nj-audio__slider" title="Volume">
        <span className="sr-only">Volume</span>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={handleVolumeChange}
          aria-label="Volume"
        />
      </label>
      <label className="nj-audio__reduce" title="Reduce audio">
        <input
          type="checkbox"
          checked={reduceAudio}
          onChange={handleReduceToggle}
          aria-label="Reduce audio"
        />
        <span>Reduce audio</span>
      </label>
    </div>
  );
};

