import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getAudioDriveSnapshot } from '@/lib/audioDrive';
import { useStore } from '@/store/useStore';

export function MusicCameraRig() {
  const { camera } = useThree();
  const audioDriveMode = useStore((state) => state.audioDriveMode);
  const currentScene = useStore((state) => state.currentScene);
  const musicCameraEnabled = useStore((state) => state.musicCameraEnabled);
  const speed = useStore((state) => state.speed);
  const chaos = useStore((state) => state.chaos);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const targetPosition = useMemo(() => new THREE.Vector3(0, 0, 5), []);

  useFrame((state) => {
    if (currentScene === 'Pulse') {
      camera.position.lerp(targetPosition.set(0, 0, 5), 0.16);
      camera.lookAt(0, 0, 0);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov += (60 - camera.fov) * 0.12;
        camera.updateProjectionMatrix();
      }
      return;
    }

    const { bass, subBass, mid, treble, beat, energy } = getAudioDriveSnapshot(audioDriveMode);
    const amount = musicCameraEnabled ? 0.8 : 0;
    const time = state.clock.elapsedTime * (0.2 + speed * 0.18);
    const orbit = time + bass * 1.8 * amount + treble * 0.8 * amount;
    const radius = 5 + subBass * 2.8 * amount + beat * 0.9 * amount;
    const lift = Math.sin(time * 1.7) * (0.35 + mid * 1.2) * amount;

    targetPosition.set(
      Math.sin(orbit) * (0.35 + chaos * 0.22) * amount,
      lift,
      radius + Math.cos(orbit * 0.7) * 0.75 * amount
    );

    camera.position.lerp(targetPosition, 0.055);
    lookTarget.set(
      Math.sin(time * 1.3) * treble * 0.55 * amount,
      Math.cos(time * 1.1) * mid * 0.45 * amount,
      beat * 0.18 * amount
    );
    camera.lookAt(lookTarget);

    if (camera instanceof THREE.PerspectiveCamera) {
      const nextFov = 60 + energy * 8 * amount + beat * 4 * amount;
      camera.fov += (nextFov - camera.fov) * 0.08;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

export function AudioMorphTone() {
  const { scene } = useThree();
  const audioDriveMode = useStore((state) => state.audioDriveMode);
  const autoVjEnabled = useStore((state) => state.autoVjEnabled);
  const bgColor = useStore((state) => state.bgColor);
  const baseColor = useStore((state) => state.baseColor);
  const secondaryColor = useStore((state) => state.secondaryColor);
  const currentScene = useStore((state) => state.currentScene);
  const quietColor = useMemo(() => new THREE.Color(), []);
  const pulseColor = useMemo(() => new THREE.Color(), []);
  const targetColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (currentScene === 'Void') {
      scene.background = quietColor.set('#000000').clone();
      return;
    }

    quietColor.set(bgColor);

    if (!autoVjEnabled) {
      scene.background = quietColor;
      return;
    }

    const { bass, treble, energy, beat } = getAudioDriveSnapshot(audioDriveMode);
    pulseColor.set(treble > bass ? secondaryColor : baseColor);
    targetColor.copy(quietColor).lerp(pulseColor, Math.min(0.11, energy * 0.045 + beat * 0.022));
    scene.background = targetColor.clone();
  });

  return null;
}
