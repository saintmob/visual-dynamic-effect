import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Glitch, ChromaticAberration } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
import * as THREE from 'three';
import { getAudioDriveSnapshot } from '@/lib/audioDrive';
import { useStore } from '@/store/useStore';

export function PostProcessing({ reduced = false }: { reduced?: boolean }) {
  const audioDriveMode = useStore((state) => state.audioDriveMode);
  const audioFxReactive = useStore((state) => state.audioFxReactive);
  const autoVjEnabled = useStore((state) => state.autoVjEnabled);
  const bloomIntensity = useStore((state) => state.bloomIntensity);
  const rgbSplitAmount = useStore((state) => state.rgbSplitAmount);
  const distortion = useStore((state) => state.distortion);
  const glitchActive = useStore((state) => state.glitchActive);
  const currentScene = useStore((state) => state.currentScene);
  const [dynamicBloom, setDynamicBloom] = useState(bloomIntensity);
  const [dynamicSplit, setDynamicSplit] = useState(rgbSplitAmount);
  const [dynamicDistortion, setDynamicDistortion] = useState(distortion);
  const [dynamicGlitch, setDynamicGlitch] = useState(false);
  const lastUpdateRef = useRef(0);
  const dynamicRef = useRef({ bloom: bloomIntensity, split: rgbSplitAmount, distortion, glitch: false });
  const renderedRef = useRef({ bloom: bloomIntensity, split: rgbSplitAmount, distortion, glitch: false });
  const chromaticOffset = useMemo(() => new THREE.Vector2(), []);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    if (now - lastUpdateRef.current < 1 / (reduced ? 12 : 20)) return;
    lastUpdateRef.current = now;

    const { energy, beat, bass, subBass, mid, treble, highMid, spectralFlux, transient, spectralCentroid, dynamicRange } = getAudioDriveSnapshot(audioDriveMode);
    const isDarkSpace = currentScene === 'Void';
    const isNeonPulse = currentScene === 'Pulse';
    const morph = autoVjEnabled && audioFxReactive ? 1 : 0;

    const pulseBloom = 0.85 + (energy * 0.24 + beat * 0.36 + transient * 0.22) * morph;
    const darkBloom = 0.45 + (energy * 0.18 + beat * 0.22 + treble * 0.16 + transient * 0.2) * morph;
    const targetBloom = isDarkSpace ? darkBloom : isNeonPulse ? pulseBloom : Math.min(
      1.18,
      bloomIntensity * 0.52 + (energy * 0.08 + beat * 0.08 + treble * 0.05 + spectralFlux * 0.055 + transient * 0.05) * morph
    );
    const pulseSplit = 0.0025 + (beat * 0.002 + spectralFlux * 0.002) * morph;
    const targetSplit = isDarkSpace ? 0 : isNeonPulse ? pulseSplit : Math.min(
      0.006,
      rgbSplitAmount * 0.45 + (bass * 0.0008 + subBass * 0.0007 + beat * 0.0008 + highMid * 0.0009 + spectralCentroid * 0.001 + spectralFlux * 0.001) * morph
    );
    const targetDistortion = isDarkSpace ? 0 : Math.min(
      0.11,
      distortion * 0.7 + (subBass * 0.035 + bass * 0.024 + mid * 0.022 + dynamicRange * 0.03 + spectralFlux * 0.03 + beat * 0.022) * morph
    );
    const targetGlitch = !isDarkSpace && glitchActive;

    const next = {
      bloom: dynamicRef.current.bloom + (targetBloom - dynamicRef.current.bloom) * (reduced ? 0.16 : 0.1),
      split: dynamicRef.current.split + (targetSplit - dynamicRef.current.split) * (reduced ? 0.28 : 0.2),
      distortion: dynamicRef.current.distortion + (targetDistortion - dynamicRef.current.distortion) * (reduced ? 0.2 : 0.16),
      glitch: reduced ? false : targetGlitch,
    };

    if (Math.abs(next.bloom - renderedRef.current.bloom) > 0.012) {
      renderedRef.current.bloom = next.bloom;
      setDynamicBloom(next.bloom);
    }
    if (Math.abs(next.split - renderedRef.current.split) > 0.00012) {
      renderedRef.current.split = next.split;
      setDynamicSplit(next.split);
    }
    if (Math.abs(next.distortion - renderedRef.current.distortion) > 0.003) {
      renderedRef.current.distortion = next.distortion;
      setDynamicDistortion(next.distortion);
    }
    if (next.glitch !== renderedRef.current.glitch) {
      renderedRef.current.glitch = next.glitch;
      setDynamicGlitch(next.glitch);
    }
    dynamicRef.current = next;
  });

  chromaticOffset.set(
    reduced ? dynamicSplit * 0.45 : dynamicSplit * 0.58,
    reduced ? dynamicSplit * 0.45 : dynamicSplit * 0.58
  );

  return (
    <EffectComposer multisampling={0}>
      {currentScene !== 'Void' && !reduced && (
        <Bloom
          luminanceThreshold={0.58}
          luminanceSmoothing={0.96}
          intensity={dynamicBloom * 0.72}
          mipmapBlur
        />
      )}
      {dynamicGlitch && (
        <Glitch
          delay={new THREE.Vector2(0.15, 0.8)}
          duration={new THREE.Vector2(0.06, 0.22)}
          strength={new THREE.Vector2(0.18 + dynamicDistortion * 0.3, 0.55 + dynamicDistortion * 0.6)}
          mode={GlitchMode.SPORADIC}
          ratio={0.85}
        />
      )}
      <ChromaticAberration offset={chromaticOffset} />
    </EffectComposer>
  );
}
