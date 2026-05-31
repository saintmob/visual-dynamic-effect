import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

function drawTextWithLetterSpacing(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, letterSpacing: number) {
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y);
    return;
  }

  const previousAlign = ctx.textAlign;
  ctx.textAlign = 'left';

  const characters = Array.from(text);
  let totalWidth = -letterSpacing;
  for (const char of characters) {
    totalWidth += ctx.measureText(char).width + letterSpacing;
  }

  let currentX = x - totalWidth / 2;
  for (const char of characters) {
    ctx.fillText(char, currentX, y);
    currentX += ctx.measureText(char).width + letterSpacing;
  }

  ctx.textAlign = previousAlign;
}

export function useTextTexture(text: string, fontSize: number, letterSpacing: number, fontWeight: number) {
  const canvas = useMemo(() => document.createElement('canvas'), []);
  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas]);

  useEffect(() => {
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 1024, 512);

    // Give it a more aggressive visual look
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 1024, 512);

    // Draw the "action" style long horizontal streak trails
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = `italic ${fontWeight} ${Math.round(fontSize * 56)}px Inter, system-ui, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw multiple strokes spreading outwards
    const trailCount = 30;
    for (let i = 0; i < trailCount; i++) {
      const offsetX = Math.pow(i, 1.4) * 8.0;
      ctx.globalAlpha = Math.max(0.0, 1.0 - (i / trailCount));
      drawTextWithLetterSpacing(ctx, text, 512 - offsetX, 280, letterSpacing);
      drawTextWithLetterSpacing(ctx, text, 512 + offsetX, 280, letterSpacing);
    }
    ctx.globalAlpha = 1.0;

    // Draw the core glitchy fill text
    ctx.fillStyle = 'white';
    ctx.font = `italic ${fontWeight} ${Math.round(fontSize * 64)}px Inter, system-ui, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif`;
    drawTextWithLetterSpacing(ctx, text, 512, 280, letterSpacing);

    // Apply minor smearing horizontally on the basic form to bake in some motion blur
    ctx.globalAlpha = 0.3;
    drawTextWithLetterSpacing(ctx, text, 512 - 20, 280, letterSpacing);
    drawTextWithLetterSpacing(ctx, text, 512 + 20, 280, letterSpacing);
    ctx.globalAlpha = 1.0;

    texture.needsUpdate = true;
  }, [text, fontSize, letterSpacing, fontWeight, canvas, texture]);

  return texture;
}

export function useCleanTextTexture(text: string, isDumbar: boolean = false, fontSize: number = 5, letterSpacing: number = -0.1, fontWeight: number = 900) {
  const canvas = useMemo(() => document.createElement('canvas'), []);
  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas]);

  const drawTextWithLetterSpacing = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, letterSpacing: number) => {
    if (letterSpacing === 0) {
      ctx.fillText(text, x, y);
      return;
    }

    const previousAlign = ctx.textAlign;
    ctx.textAlign = 'left';

    const characters = Array.from(text);
    let totalWidth = -letterSpacing;
    for (const char of characters) {
      totalWidth += ctx.measureText(char).width + letterSpacing;
    }

    let currentX = x - totalWidth / 2;
    for (const char of characters) {
      ctx.fillText(char, currentX, y);
      currentX += ctx.measureText(char).width + letterSpacing;
    }

    ctx.textAlign = previousAlign;
  };

  useEffect(() => {
    // High res for crisp text
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 2048, 1024);

    ctx.fillStyle = 'rgba(255,255,255,1.0)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontWeight} ${Math.round(fontSize * 96)}px Inter, system-ui, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif`;

    if (isDumbar) {
      // Dumbar style: transparent background, crisp white text on transparent.
      drawTextWithLetterSpacing(ctx, text, 1024, 512, letterSpacing);
    } else {
      drawTextWithLetterSpacing(ctx, text, 1024, 512, letterSpacing);
    }

    texture.needsUpdate = true;
  }, [text, canvas, texture, isDumbar, fontSize, letterSpacing, fontWeight]);

  return texture;
}

export function useDarkSpaceTextTexture(text: string, fontSize: number, letterSpacing: number, fontWeight: number) {
  const canvas = useMemo(() => document.createElement('canvas'), []);
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }, [canvas]);

  useEffect(() => {
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayText = text.trim().toUpperCase();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!displayText) {
      texture.needsUpdate = true;
      return;
    }

    let fontPx = Math.round(fontSize * 112);
    const family = 'Inter, Arial Black, Impact, system-ui, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif';
    const chars = Array.from(displayText);
    const spacingPx = letterSpacing * fontSize * 24;

    const measure = () => {
      ctx.font = `italic ${fontWeight} ${fontPx}px ${family}`;
      return chars.reduce((sum, char, index) => sum + ctx.measureText(char).width + (index === chars.length - 1 ? 0 : spacingPx), 0);
    };

    while (measure() > canvas.width * 0.9 && fontPx > 110) {
      fontPx -= 14;
    }

    ctx.font = `italic ${fontWeight} ${fontPx}px ${family}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const totalWidth = measure();
    let x = (canvas.width - totalWidth) / 2;
    const y = canvas.height * 0.53;

    chars.forEach((char, index) => {
      const width = ctx.measureText(char).width;
      const id = chars.length <= 1 ? 0.5 : index / Math.max(1, chars.length - 1);
      const red = Math.round(36 + id * 208);
      const green = Math.round(255 - id * 156);
      const blue = Math.round(130 + (index % 3) * 42);

      ctx.save();
      ctx.translate(x + width / 2, y);
      ctx.transform(1, 0, -0.18, 1, 0, 0);
      ctx.translate(-(x + width / 2), -y);
      ctx.lineWidth = Math.max(10, fontPx * 0.032);
      ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.92)`;
      ctx.strokeText(char, x, y);
      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 1)`;
      ctx.fillText(char, x, y);
      ctx.restore();

      x += width + spacingPx;
    });

    texture.needsUpdate = true;
  }, [text, fontSize, letterSpacing, fontWeight, canvas, texture]);

  return texture;
}
