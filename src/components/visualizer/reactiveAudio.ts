import { getAudioDriveSnapshot } from '@/lib/audioDrive';
import { useStore } from '@/store/useStore';

const REACTIVE_AUDIO_FRAME_MS = 1000 / 60;
let reactiveAudioCache:
  | { frame: number; mode: string; autoVjEnabled: boolean; snapshot: ReturnType<typeof getAudioDriveSnapshot> }
  | null = null;

export function getReactiveAudio() {
  const { audioDriveMode, autoVjEnabled } = useStore.getState();
  const now = typeof performance === 'undefined' ? Date.now() : performance.now();
  const frame = Math.floor(now / REACTIVE_AUDIO_FRAME_MS);
  if (
    reactiveAudioCache &&
    reactiveAudioCache.frame === frame &&
    reactiveAudioCache.mode === audioDriveMode &&
    reactiveAudioCache.autoVjEnabled === autoVjEnabled
  ) {
    return reactiveAudioCache.snapshot;
  }

  const audio = getAudioDriveSnapshot(audioDriveMode);
  const motionAmount = autoVjEnabled ? 0.9 : 0;
  const beatAmount = autoVjEnabled ? 0.75 : 0;

  const snapshot = {
    ...audio,
    volume: audio.volume * motionAmount,
    subBass: audio.subBass * motionAmount,
    bass: audio.bass * motionAmount,
    lowMid: audio.lowMid * motionAmount,
    mid: audio.mid * motionAmount,
    highMid: audio.highMid * motionAmount,
    treble: audio.treble * motionAmount,
    energy: audio.energy * motionAmount,
    beat: audio.beat * beatAmount,
    spectralCentroid: audio.spectralCentroid * motionAmount,
    spectralFlux: audio.spectralFlux * motionAmount,
    transient: audio.transient * motionAmount,
    dynamicRange: audio.dynamicRange * motionAmount,
  };
  reactiveAudioCache = { frame, mode: audioDriveMode, autoVjEnabled, snapshot };
  return snapshot;
}
