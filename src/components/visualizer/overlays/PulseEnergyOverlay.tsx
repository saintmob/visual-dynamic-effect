import type { CSSProperties } from 'react';
import { useStore } from '@/store/useStore';

export function PulseEnergyOverlay({ sceneOverride }: { sceneOverride?: string }) {
  const currentScene = useStore((state) => state.currentScene);
  const textInput = useStore((state) => state.textInput);
  const textAnimStyle = useStore((state) => state.textAnimStyle);
  const textFontSize = useStore((state) => state.textFontSize);
  const textFontWeight = useStore((state) => state.textFontWeight);
  const textLetterSpacing = useStore((state) => state.textLetterSpacing);
  const textGlow = useStore((state) => state.textGlow);
  const textSpeed = useStore((state) => state.textSpeed);
  const textColor = useStore((state) => state.textColor);
  const scene = sceneOverride || currentScene;
  if (scene !== 'Pulse') return null;

  const trimmedText = textInput.trim();
  if (!trimmedText) return null;

  const displayText = trimmedText.toUpperCase();
  const normalizedStyle = ['Cinematic', 'Massive', 'Glitch', 'Hologram', 'Floating', 'Beat'].includes(textAnimStyle)
    ? textAnimStyle.toLowerCase()
    : 'glitch';
  const textLengthScale = Math.max(0.72, Math.min(1, 5 / Math.max(displayText.length, 1)));
  const titleStyle = {
    '--pulse-title-size': `${Math.max(36, Math.min(224, textFontSize * 30 * textLengthScale))}px`,
    '--pulse-title-weight': textFontWeight,
    '--pulse-title-spacing': `${textLetterSpacing}em`,
    '--pulse-title-speed': `${Math.max(0.35, 1.45 / Math.max(textSpeed, 0.2))}s`,
    '--pulse-title-glow': `${Math.max(10, Math.min(72, 12 + textGlow * 11))}px`,
    '--pulse-title-color': textColor,
  } as CSSProperties;

  const fragments = Array.from({ length: 22 }, (_, index) => {
    const style = {
      '--x': `${(index * 37) % 100}%`,
      '--y': `${22 + ((index * 19) % 52)}%`,
      '--w': `${24 + ((index * 13) % 86)}px`,
      '--d': `${(index % 7) * -0.31}s`,
      '--a': `${-14 + ((index * 23) % 28)}deg`,
    } as CSSProperties;

    return <i key={index} className="pulse-energy-fragment" style={style} />;
  });

  const plates = Array.from({ length: 9 }, (_, index) => {
    const style = {
      '--px': `${8 + ((index * 23) % 82)}%`,
      '--py': `${34 + ((index * 17) % 30)}%`,
      '--pw': `${42 + ((index * 29) % 118)}px`,
      '--ph': `${16 + ((index * 11) % 44)}px`,
      '--pa': `${-22 + ((index * 31) % 44)}deg`,
      '--pd': `${(index % 5) * -0.37}s`,
    } as CSSProperties;

    return <i key={index} className="pulse-energy-plate" style={style} />;
  });

  const trails = Array.from({ length: 8 }, (_, index) => {
    const style = {
      '--ty': `${26 + index * 6}%`,
      '--td': `${index * -0.42}s`,
      '--tw': `${34 + ((index * 17) % 42)}%`,
    } as CSSProperties;

    return <i key={index} className="pulse-energy-trail" style={style} />;
  });

  return (
    <div className="pulse-energy-overlay" aria-hidden="true">
      <div className="pulse-energy-haze" />
      <div className="pulse-energy-band" />
      {trails}
      {plates}
      {fragments}
      <div
        className={`pulse-energy-title pulse-energy-title--${normalizedStyle}`}
        data-text={displayText}
        style={titleStyle}
      >
        <span>{displayText}</span>
      </div>
      <div className="pulse-energy-scan" />
      <div className="pulse-energy-noise" />
    </div>
  );
}
