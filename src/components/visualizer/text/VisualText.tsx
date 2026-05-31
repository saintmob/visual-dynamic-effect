import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';
import { getReactiveAudio } from '../reactiveAudio';
import { useCleanTextTexture } from './textTextures';

// === CINEMATIC TYPOGRAPHY ===
export function VisualText({ sceneOverride }: { sceneOverride?: string }) {
  const textRef = useRef<THREE.Mesh>(null);
  const currentScene = useStore((state) => state.currentScene);
  const textInput = useStore((state) => state.textInput);
  const textAnimStyle = useStore((state) => state.textAnimStyle);
  const textGlow = useStore((state) => state.textGlow);
  const textSpeed = useStore((state) => state.textSpeed);
  const textReactive = useStore((state) => state.textReactive);
  const textColor = useStore((state) => state.textColor);
  const textFontSize = useStore((state) => state.textFontSize);
  const textLetterSpacing = useStore((state) => state.textLetterSpacing);
  const textFontWeight = useStore((state) => state.textFontWeight);
  const scene = sceneOverride || currentScene;

  const displayText = textInput.toUpperCase();
  const tex = useCleanTextTexture(displayText, false, textFontSize, textLetterSpacing, textFontWeight);

  useFrame((state) => {
    if(!textRef.current) return;
    const { bass, beat } = getReactiveAudio();
    const t = state.clock.elapsedTime * textSpeed;
    const react = bass * textReactive + (beat * 0.5 * textReactive);

    if(textAnimStyle === 'Cinematic') {
      textRef.current.scale.setScalar(1 + react * 0.2);
      textRef.current.position.y = Math.sin(t) * 0.2;
      textRef.current.rotation.set(0,0,0);
    } else if (textAnimStyle === 'Glitch') {
      textRef.current.scale.setScalar(1 + react * 0.34);
      textRef.current.rotation.set(0,0,0);
      textRef.current.position.x = Math.sin(t * 5.1) * react * 0.08 + Math.sin(t * 1.7) * beat * 0.05;
      textRef.current.position.y = Math.cos(t * 3.3) * react * 0.035;
    } else if (textAnimStyle === 'Beat') {
      textRef.current.scale.setScalar(1.5 + (react * 0.72) + (beat * 0.32));
      textRef.current.position.set(0, Math.sin(t * 1.4) * react * 0.08, 1 + bass * 0.72);
      textRef.current.rotation.z = Math.sin(t * 3.2) * 0.025 * beat;
    } else if (textAnimStyle === 'Floating') {
      textRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
      textRef.current.position.y = Math.sin(t) * 0.5;
      textRef.current.scale.setScalar(1 + (react * 0.1));
    } else if (textAnimStyle === 'Massive') {
      textRef.current.scale.setScalar(4 + react * 2.5);
      textRef.current.position.z = -2 + (beat * 2.0);
      textRef.current.rotation.set(0,0,0);
    } else {
      textRef.current.scale.setScalar(1 + react * 0.5);
    }

    // Adjust material properties dynamically if needed
    const mat = textRef.current.material as THREE.MeshBasicMaterial;
    if(mat && mat.color) {
       mat.color.set(textColor);
       mat.color.multiplyScalar(Math.min(1.35, 0.82 + textGlow * 0.16 + beat * 0.24));
    }
  });

  if(!textInput.trim() || scene === 'Void' || scene === 'Dumbar' || scene === 'Topology' || scene === 'Pulse') return null;

  return (
    <mesh ref={textRef} position={[0, 0, 2.2]} renderOrder={60}>
      <planeGeometry args={[20, 10]} />
      <meshBasicMaterial
        map={tex}
        color={textColor}
        transparent
        opacity={0.92}
        depthWrite={false}
        depthTest={false}
        blending={scene === 'Pulse' || scene === 'Cyber' ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </mesh>
  );
}
