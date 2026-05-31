import { useEffect, useRef, type CSSProperties } from 'react';
import { useStore } from '@/store/useStore';
import { getReactiveAudio } from '../reactiveAudio';

export function DarkSpaceTextOverlay({ sceneOverride }: { sceneOverride?: string }) {
  const currentScene = useStore((state) => state.currentScene);
  const textInput = useStore((state) => state.textInput);
  const textFontSize = useStore((state) => state.textFontSize);
  const textFontWeight = useStore((state) => state.textFontWeight);
  const textLetterSpacing = useStore((state) => state.textLetterSpacing);
  const textGlow = useStore((state) => state.textGlow);
  const textSpeed = useStore((state) => state.textSpeed);
  const scene = sceneOverride || currentScene;
  const rootRef = useRef<HTMLDivElement>(null);
  const displayText = textInput.trim().toUpperCase();
  const characters = Array.from(displayText);
  const slices = [0, 1, 2, 3, 4, 5, 6];
  const particles = Array.from({ length: 34 }, (_, index) => index);
  const tears = Array.from({ length: 9 }, (_, index) => index);
  const motionRef = useRef({
    burst: 0,
    shock: 0,
    tear: 0,
    lastHit: 0,
    focus: 0.5,
    direction: 1,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const elements = {
      word: root.querySelector<HTMLElement>('.dark-space-word'),
      chars: Array.from(root.querySelectorAll<HTMLElement>('.dark-space-char')),
      slices: Array.from(root.querySelectorAll<HTMLElement>('.dark-space-slice')),
      redChannels: Array.from(root.querySelectorAll<HTMLElement>('.dark-space-char-red')),
      blueChannels: Array.from(root.querySelectorAll<HTMLElement>('.dark-space-char-blue')),
      tears: Array.from(root.querySelectorAll<HTMLElement>('.dark-space-tear')),
      particles: Array.from(root.querySelectorAll<HTMLElement>('.dark-space-particle')),
    };
    let frame = 0;
    const tick = () => {
      const root = rootRef.current;
      if (root) {
        const { subBass, bass, lowMid, mid, highMid, treble, beat, energy, spectralFlux, transient } = getReactiveAudio();
        const now = performance.now() / 1000;
        const motion = motionRef.current;
        const attack = Math.max(beat * 1.5, transient * 1.35, spectralFlux * 1.05, bass * 0.68, highMid * 0.48);
        const unstableIdleHit = now - motion.lastHit > 0.72 && Math.random() > 0.982;
        const triggerWindow = 0.12 + Math.random() * 0.12;
        if ((attack > 0.32 || unstableIdleHit || (spectralFlux > 0.22 && Math.random() > 0.88)) && now - motion.lastHit > triggerWindow) {
          const hit = Math.min(1.8, Math.max(attack, unstableIdleHit ? 0.34 + Math.random() * 0.38 : 0) + Math.random() * 0.62);
          motion.burst = Math.max(motion.burst, hit);
          motion.shock = Math.max(motion.shock, hit * (0.72 + Math.random() * 0.42));
          motion.tear = Math.max(motion.tear, hit * (0.8 + Math.random() * 0.55));
          motion.focus = Math.random();
          motion.direction = Math.random() > 0.5 ? 1 : -1;
          motion.lastHit = now;
        }
        motion.burst *= 0.82;
        motion.shock *= 0.74;
        motion.tear *= 0.78;

        const burst = motion.burst;
        const shock = motion.shock;
        const tear = motion.tear;
        const liveEnergy = Math.max(0.08, energy, bass * 0.55, spectralFlux * 0.52);
        const drift = Math.sin(now * 0.23) * 0.5 + Math.sin(now * 0.41 + 1.7) * 0.5;
        const twitch = Math.sin(now * 18.0 + motion.focus * 9.0) * shock;

        root.style.setProperty('--ds-time', now.toFixed(3));
        root.style.setProperty('--ds-sub', subBass.toFixed(3));
        root.style.setProperty('--ds-bass', bass.toFixed(3));
        root.style.setProperty('--ds-lowmid', lowMid.toFixed(3));
        root.style.setProperty('--ds-mid', mid.toFixed(3));
        root.style.setProperty('--ds-highmid', highMid.toFixed(3));
        root.style.setProperty('--ds-treble', treble.toFixed(3));
        root.style.setProperty('--ds-beat', beat.toFixed(3));
        root.style.setProperty('--ds-energy', energy.toFixed(3));
        root.style.setProperty('--ds-flux', spectralFlux.toFixed(3));
        root.style.setProperty('--ds-transient', transient.toFixed(3));
        root.style.setProperty('--ds-burst', burst.toFixed(3));
        root.style.setProperty('--ds-shock', shock.toFixed(3));
        root.style.setProperty('--ds-tear', tear.toFixed(3));

        if (elements.word) {
          const jumpX = drift * 18 + twitch * 34 + motion.direction * burst * 58;
          const jumpY = Math.sin(now * 0.31 + 2.6) * 10 * liveEnergy - burst * 28 + shock * 46;
          const scaleX = 1 + bass * 0.09 + beat * 0.05 + burst * 0.24;
          const scaleY = 1 + subBass * 0.07 + shock * 0.18 - tear * 0.035;
          const skew = -9 - lowMid * 16 + motion.direction * shock * 18 + Math.sin(now * 1.7) * 4 * liveEnergy;
          const rotate = motion.direction * shock * 2.8 + drift * 1.4;
          elements.word.style.transform = `translate3d(${jumpX.toFixed(2)}px, ${jumpY.toFixed(2)}px, 0) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}) skewX(${skew.toFixed(2)}deg) rotate(${rotate.toFixed(2)}deg)`;
          elements.word.style.filter = `contrast(${1.35 + energy * 0.7 + burst * 0.7}) saturate(${1.28 + treble * 1.6 + shock * 0.7}) brightness(${1 + burst * 0.42 + shock * 0.35}) drop-shadow(0 0 ${22 + textGlow * 12 + burst * 42}px rgba(36,230,255,0.78)) drop-shadow(0 0 ${18 + textGlow * 10 + shock * 52}px rgba(255,20,0,0.9))`;
        }

        elements.chars.forEach((element) => {
          const index = Number(element.dataset.index || 0);
          const seed = Number(element.dataset.seed || 0);
          const region = characters.length <= 1 ? 0.5 : index / (characters.length - 1);
          const centerPull = 1 - Math.min(1, Math.abs(region - motion.focus) * 2.8);
          const leftDrift = (1 - region) * (Math.sin(now * (0.33 + seed * 0.12) + index) * 34 * (0.3 + bass));
          const centerTwitch = centerPull * (Math.sin(now * (19 + seed * 11) + index * 3.7) * (58 * mid + 120 * shock));
          const rightBuzz = region * (Math.sin(now * (42 + seed * 28)) * (22 * highMid + 42 * treble));
          const explosion = (region - motion.focus) * (burst * 260 + transient * 90);
          const dx = leftDrift + centerTwitch + rightBuzz + explosion + motion.direction * tear * (seed - 0.5) * 170;
          const dy = Math.cos(now * (0.8 + seed) + index) * bass * 24 + Math.sin(now * (11 + seed * 6)) * highMid * 22 + (seed - 0.5) * burst * 130;
          const sx = 1 + shock * centerPull * 0.42 + spectralFlux * seed * 0.16;
          const sy = 1 + subBass * (0.08 + seed * 0.08) + burst * (0.06 + centerPull * 0.18);
          const skew = (seed - 0.5) * mid * 38 + motion.direction * tear * centerPull * 34;
          const rotate = (seed - 0.5) * shock * 16 + Math.sin(now * 4.2 + index) * spectralFlux * 8;
          element.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)}) skewX(${skew.toFixed(2)}deg) rotate(${rotate.toFixed(2)}deg)`;
        });

        elements.slices.forEach((element) => {
          const sliceIndex = Number(element.dataset.slice || 0);
          const seed = Number(element.dataset.seed || 0);
          const row = sliceIndex - 3;
          const snap = Math.sin(now * (9 + seed * 21) + row * 1.9);
          const tearPush = row * tear * 36 + (seed - 0.5) * (mid * 170 + transient * 220 + shock * 260);
          const dx = tearPush + snap * (spectralFlux * 90 + highMid * 58) + motion.direction * burst * row * 34;
          const dy = Math.cos(now * (7 + seed * 13) + sliceIndex) * (treble * 10 + shock * 18);
          const skew = (seed - 0.5) * 54 * Math.max(mid, highMid) + row * shock * 5;
          const scaleX = 1 + Math.abs(row) * tear * 0.12 + spectralFlux * 0.35;
          element.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) skewX(${skew.toFixed(2)}deg) scaleX(${scaleX.toFixed(3)})`;
          element.style.opacity = String(Math.min(1, 0.16 + mid * 0.8 + spectralFlux * 0.72 + transient * 0.42 + shock * 0.5));
        });

        elements.redChannels.forEach((element) => {
          element.style.transform = `translate3d(${-8 - treble * 52 - transient * 44 - shock * 64}px, ${motion.direction * shock * 10}px, 0)`;
          element.style.opacity = String(Math.min(1, 0.28 + treble * 0.95 + transient * 0.9 + shock * 0.65));
        });

        elements.blueChannels.forEach((element) => {
          element.style.transform = `translate3d(${8 + highMid * 48 + treble * 36 + shock * 56}px, ${-motion.direction * shock * 12}px, 0)`;
          element.style.opacity = String(Math.min(1, 0.26 + treble * 0.88 + highMid * 0.62 + shock * 0.58));
        });

        elements.tears.forEach((element) => {
          const index = Number(element.dataset.index || 0);
          const seed = Number(element.dataset.seed || 0);
          const y = 14 + ((index * 11 + Math.floor(now * (2 + seed * 5))) % 72);
          const x = -20 + seed * 58 + Math.sin(now * (0.7 + seed) + index) * 10;
          const width = 22 + seed * 42 + tear * 32;
          element.style.opacity = String(Math.min(0.9, tear * (0.18 + seed * 0.72) + spectralFlux * 0.22));
          element.style.transform = `translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}vh, 0) translateX(${motion.direction * tear * (80 + seed * 180)}px) scaleX(${Math.max(0.12, width / 100).toFixed(3)}) skewX(${-18 + seed * 36}deg)`;
        });

        elements.particles.forEach((element) => {
          const index = Number(element.dataset.index || 0);
          const seed = Number(element.dataset.seed || 0);
          const angle = seed * Math.PI * 2 + now * (0.4 + seed);
          const radius = 18 + seed * 42 + burst * 280 + spectralFlux * 80;
          const x = Math.cos(angle) * radius + Math.sin(now * (2.0 + seed)) * highMid * 60;
          const y = Math.sin(angle * 0.8 + index) * radius * 0.42 + Math.cos(now * (3.1 + seed)) * bass * 44;
          const scale = 0.35 + seed * 0.9 + burst * 1.4;
          element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(2)})`;
          element.style.opacity = String(Math.min(0.82, 0.05 + burst * 0.52 + spectralFlux * 0.28 + treble * seed * 0.22));
        });
      }
      frame = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(frame);
  }, [characters.length, textGlow]);

  const textLengthScale = Math.max(0.46, Math.min(1, 8 / Math.max(characters.length, 1)));
  const titleStyle = {
    '--ds-size': `${Math.max(58, Math.min(220, textFontSize * 34 * textLengthScale))}px`,
    '--ds-weight': textFontWeight,
    '--ds-spacing': `${textLetterSpacing}em`,
    '--ds-glow': `${Math.max(12, Math.min(86, 18 + textGlow * 11))}px`,
    '--ds-speed': Math.max(0.35, textSpeed),
  } as CSSProperties;

  if (scene !== 'Void' || !displayText) return null;

  return (
    <div ref={rootRef} className="dark-space-typography" style={titleStyle} aria-hidden="true">
      <div className="dark-space-word">
        {characters.map((char, charIndex) => {
          const charStyle = {
            '--char-index': charIndex,
            '--char-seed': ((charIndex * 37) % 19) / 19,
          } as CSSProperties;

          return (
            <span
              key={`${char}-${charIndex}`}
              className="dark-space-char"
              data-char={char}
              data-index={charIndex}
              data-seed={((charIndex * 37) % 19) / 19}
              style={charStyle}
            >
              {slices.map((sliceIndex) => {
                const sliceStyle = {
                  '--slice-index': sliceIndex,
                  '--slice-top': `${sliceIndex * (100 / slices.length)}%`,
                  '--slice-bottom': `${100 - (sliceIndex + 1) * (100 / slices.length)}%`,
                  '--slice-seed': ((sliceIndex * 23 + charIndex * 11) % 17) / 17,
                } as CSSProperties;

                return (
                  <span
                    key={sliceIndex}
                    className="dark-space-slice"
                    data-slice={sliceIndex}
                    data-seed={((sliceIndex * 23 + charIndex * 11) % 17) / 17}
                    style={sliceStyle}
                  >
                    {char}
                  </span>
                );
              })}
              <span className="dark-space-char-core">{char}</span>
              <span className="dark-space-char-red">{char}</span>
              <span className="dark-space-char-blue">{char}</span>
            </span>
          );
        })}
      </div>
      <div className="dark-space-tear-field">
        {tears.map((index) => (
          <i
            key={index}
            className="dark-space-tear"
            data-index={index}
            data-seed={((index * 29) % 23) / 23}
          />
        ))}
      </div>
      <div className="dark-space-particle-field">
        {particles.map((index) => (
          <i
            key={index}
            className="dark-space-particle"
            data-index={index}
            data-seed={((index * 41) % 31) / 31}
          />
        ))}
      </div>
      <div className="dark-space-scan" />
      <div className="dark-space-noise" />
    </div>
  );
}
