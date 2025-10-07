declare module "zzfx" {
  export function zzfx(
    ...parameters: number[]
  ): AudioBufferSourceNode | undefined;
  export const ZZFX: {
    volume: number;
    sampleRate: number;
    audioContext: AudioContext;
    play: (...parameters: number[]) => AudioBufferSourceNode | undefined;
    playSamples: (
      sampleChannels: Float32Array[],
      volumeScale?: number,
      rate?: number,
      pan?: number,
      loop?: boolean,
    ) => AudioBufferSourceNode | undefined;
    buildSamples: (...parameters: number[]) => Float32Array;
  };
}
