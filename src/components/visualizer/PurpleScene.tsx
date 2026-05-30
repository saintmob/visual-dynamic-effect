import { useEffect, useRef, useState } from 'react';
import { getAudioDriveSnapshot } from '@/lib/audioDrive';
import { useStore } from '@/store/useStore';

const vertexShaderSource = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  varying vec2 vUv;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uBeat;
  uniform float uFlux;
  uniform float uMotion;
  uniform float uImpact;
  uniform float uStructure;
  uniform float uWarp;
  uniform float uDetail;
  uniform float uBreakup;
  uniform float uGlow;
  uniform float uDepth;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 r = mat2(0.83, 0.56, -0.56, 0.83);
    for (int i = 0; i < 5; i++) {
      v += noise(p) * a;
      p = r * p * 2.04 + 17.7;
      a *= 0.52;
    }
    return v;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
    uv.x *= uResolution.x / max(uResolution.y, 1.0);

    float radius = length(uv);
    float angle = atan(uv.y, uv.x);
    float tunnel = uTime * (0.22 + uMotion * 0.32) + uBass * 0.18;
    angle += sin(radius * (2.5 + uStructure * 4.0) - tunnel * 2.0) * (0.12 + uWarp * 0.34);

    vec2 polar = vec2(cos(angle), sin(angle)) * (radius * (1.2 + uDepth * 0.55));
    vec2 flow = polar * (2.0 + uDetail * 3.6) + vec2(tunnel, -tunnel * 0.42);
    vec2 warp = vec2(
      fbm(flow + vec2(0.0, uTime * 0.14)),
      fbm(flow.yx + vec2(8.4, -uTime * 0.11))
    );
    float river = fbm(flow + warp * (2.2 + uWarp * 3.2));

    float ringA = exp(-abs(radius - (0.36 + sin(tunnel + uBeat * 1.8) * 0.08)) * (5.0 + uStructure * 8.0));
    float ringB = exp(-abs(radius - (0.82 + uBass * 0.18)) * (8.0 + uStructure * 5.0)) * (0.45 + uImpact * 0.4);
    float stream = clamp(ringA + ringB, 0.0, 1.4);

    float facets = smoothstep(0.52, 0.92, river) * stream;
    float liquid = smoothstep(0.18, 0.88, fbm(flow * 0.72 + warp * 4.0));
    float sparkleGrid = hash(floor(flow * (10.0 + uDetail * 18.0)) + floor(uTime * (4.0 + uTreble * 24.0)));
    float sparkle = pow(sparkleGrid, 18.0) * (0.18 + uTreble * 1.55 + uFlux * 0.8) * stream * uGlow;
    float breakCells = step(0.93 - uBreakup * 0.18 - uFlux * 0.12, hash(floor(uv * vec2(90.0, 54.0)) + floor(uTime * 18.0)));

    vec3 dark = vec3(0.012, 0.005, 0.028);
    vec3 purple = mix(uSecondary, vec3(0.55, 0.05, 1.0), 0.5);
    vec3 cyan = mix(uAccent, vec3(0.08, 0.95, 1.0), 0.42);
    vec3 col = dark;
    col = mix(col, purple, liquid * 0.44 + facets * 0.52);
    col += uPrimary * facets * (0.32 + uBass * 0.32);
    col += cyan * sparkle * (0.75 + uGlow * 0.6);
    col += vec3(1.0, 0.88, 1.0) * pow(max(0.0, river * stream), 4.0) * (0.42 + uBeat * 0.5);
    col += cyan * breakCells * uBreakup * (0.08 + uTreble * 0.22);

    float vignette = 1.0 - smoothstep(0.62 + uDepth * 0.28, 1.92, radius);
    col *= vignette;
    col *= 0.86 + uGlow * 0.32 + uImpact * 0.2;
    col += (hash(gl_FragCoord.xy + floor(uTime * 26.0)) - 0.5) * (0.018 + uBreakup * 0.035);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

const hexToRgb = (hex: string): [number, number, number] => {
  const cleaned = hex.replace('#', '');
  const value = Number.parseInt(cleaned, 16);
  if (!Number.isFinite(value)) return [1, 1, 1];
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

const compileShader = (gl: WebGLRenderingContext, source: string, type: number) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Purple shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

export function PurpleScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const [shaderError, setShaderError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) {
      setShaderError('WebGL is not available for Purple.');
      return undefined;
    }

    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      setShaderError('Purple shader failed to compile.');
      return undefined;
    }

    const program = gl.createProgram();
    if (!program) return undefined;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setShaderError(`Purple shader failed to link: ${gl.getProgramInfoLog(program)}`);
      return undefined;
    }

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 1);

    const uniformCache = new Map<string, WebGLUniformLocation | null>();
    const uniform = (name: string) => {
      if (!uniformCache.has(name)) uniformCache.set(name, gl.getUniformLocation(program, name));
      return uniformCache.get(name);
    };
    const setFloat = (name: string, value: number) => {
      const location = uniform(name);
      if (location) gl.uniform1f(location, value);
    };
    const setVec2 = (name: string, x: number, y: number) => {
      const location = uniform(name);
      if (location) gl.uniform2f(location, x, y);
    };
    const setVec3 = (name: string, rgb: [number, number, number]) => {
      const location = uniform(name);
      if (location) gl.uniform3f(location, rgb[0], rgb[1], rgb[2]);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(1.25, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    let lastTimestamp = performance.now();
    const render = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;
      timeRef.current += delta;
      resize();

      const store = useStore.getState();
      const liveControls = store.liveControls;
      const audio = getAudioDriveSnapshot(store.audioDriveMode);
      const live = store.autoVjEnabled ? 1 : 0.28;
      const bass = Math.min(1.8, Math.max(audio.bass, audio.subBass) * live);
      const mid = Math.min(1.6, Math.max(audio.mid, audio.lowMid) * live);
      const treble = Math.min(1.8, Math.max(audio.treble, audio.highMid) * live);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      setVec2('uResolution', canvas.width, canvas.height);
      setFloat('uTime', timeRef.current);
      setFloat('uBass', bass);
      setFloat('uMid', mid);
      setFloat('uTreble', treble);
      setFloat('uBeat', audio.beat);
      setFloat('uFlux', audio.spectralFlux);
      setFloat('uMotion', 0.5 + liveControls.energyX * 1.4);
      setFloat('uImpact', 0.5 + liveControls.energyY * 1.5);
      setFloat('uStructure', 0.45 + liveControls.structureX * 1.7);
      setFloat('uWarp', 0.36 + liveControls.structureY * 1.65);
      setFloat('uDetail', 0.42 + liveControls.textureX * 1.75);
      setFloat('uBreakup', liveControls.textureY);
      setFloat('uGlow', 0.45 + liveControls.atmosphereX * 1.85);
      setFloat('uDepth', 0.36 + liveControls.atmosphereY * 1.65);
      setVec3('uPrimary', hexToRgb(store.baseColor || '#ffffff'));
      setVec3('uSecondary', hexToRgb(store.secondaryColor || '#6d28d9'));
      setVec3('uAccent', hexToRgb(store.accentColor || '#00e1ff'));

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frameRef.current = requestAnimationFrame(render);
    };

    setShaderError(null);
    frameRef.current = requestAnimationFrame(render);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
    };
  }, []);

  if (shaderError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black px-6 text-center text-xs font-bold uppercase tracking-widest text-fuchsia-200">
        {shaderError}
      </div>
    );
  }

  return <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full bg-black" aria-label="Purple visual template" />;
}
