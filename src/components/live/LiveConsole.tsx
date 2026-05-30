import { useCallback, useEffect, useMemo, useState } from 'react';
import { Maximize2, Radio, Save, Sparkles, Waves } from 'lucide-react';
import { Visualizer } from '@/components/visualizer/Visualizer';
import { getAudioDriveSnapshot } from '@/lib/audioDrive';
import type { AudioDebugSnapshot } from '@/lib/AudioEngine';
import { applyLiveControlPatch, getLivePadPatch, LIVE_PAD_DEFINITIONS } from '@/lib/liveControls';
import { useStore, type VisualInputSource } from '@/store/useStore';
import { liveVisualModules } from '@/visuals/registry';
import { LivePad } from './LivePad';

interface LiveConsoleProps {
  audioReady: boolean;
  audioDebug: AudioDebugSnapshot;
  initError: string;
  micStatusText: string;
  selectInputSource: (source: VisualInputSource) => void;
  toggleFullscreenView: () => void;
}

export function LiveConsole({ audioReady, audioDebug, initError, micStatusText, selectInputSource, toggleFullscreenView }: LiveConsoleProps) {
  const activeScreenId = useStore((state) => state.activeScreenId);
  const applyPreset = useStore((state) => state.applyPreset);
  const applyVisualMemory = useStore((state) => state.applyVisualMemory);
  const currentScene = useStore((state) => state.currentScene);
  const liveControls = useStore((state) => state.liveControls);
  const saveVisualMemory = useStore((state) => state.saveVisualMemory);
  const setLiveControls = useStore((state) => state.setLiveControls);
  const setLiveMode = useStore((state) => state.setLiveMode);
  const setScreenEnabled = useStore((state) => state.setScreenEnabled);
  const visualInputSource = useStore((state) => state.visualInputSource);
  const visualMemories = useStore((state) => state.visualMemories);
  const visualScreens = useStore((state) => state.visualScreens);
  const [meters, setMeters] = useState({ volume: 0, bass: 0, beat: 0 });
  const activeScreen = visualScreens.find((screen) => screen.id === activeScreenId) || visualScreens[0];

  useEffect(() => {
    const timer = window.setInterval(() => {
      const audio = getAudioDriveSnapshot(useStore.getState().audioDriveMode);
      setMeters({
        volume: Math.min(1, audio.volume * 1.8),
        bass: Math.min(1, Math.max(audio.subBass, audio.bass, audio.lowMid) * 1.9),
        beat: Math.min(1, Math.max(audio.beat, audio.transient)),
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, []);

  const sourceOptions = useMemo(() => [
    { source: 'api' as const, label: 'Show API' },
    { source: 'mic' as const, label: 'Mic' },
    { source: 'music' as const, label: 'Debug' },
  ], []);

  const chooseLook = useCallback((presetId: string) => {
    applyPreset(presetId);
    setLiveControls({ selectedLookId: presetId });
  }, [applyPreset, setLiveControls]);

  const updatePad = useCallback((padId: string, x: number, y: number) => {
    const pad = LIVE_PAD_DEFINITIONS.find((item) => item.id === padId);
    if (!pad) return;
    const patch = getLivePadPatch(pad, x, y);
    useStore.setState((state) => applyLiveControlPatch(state.liveControls, patch));
  }, []);

  const signalLabel = visualInputSource === 'mic'
    ? micStatusText
    : visualInputSource === 'api'
      ? 'SHOW API / DJ LINK'
      : 'MUSIC DEBUG';

  return (
    <div className="flex h-[100dvh] min-h-[100svh] flex-col overflow-hidden bg-[#050506] text-white">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-black">
            <Sparkles size={15} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-black uppercase tracking-widest">Nexus.VJ Live Console</div>
            <div className="hidden text-[9px] font-bold uppercase tracking-widest text-white/35 sm:block">Home is performance. Studio is design.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/55 md:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${visualInputSource === 'mic' && !audioReady ? 'bg-yellow-300' : 'bg-emerald-400'}`} />
            {signalLabel}
          </div>
          <button
            type="button"
            onClick={() => setLiveMode(false)}
            className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/65 hover:bg-white hover:text-black"
          >
            Studio
          </button>
        </div>
      </header>

      <main className="grid flex-1 min-h-0 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(240px,320px)_minmax(360px,600px)_minmax(320px,1fr)]">
        <section className="min-h-0 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0d] p-4">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
            <Waves size={15} className="text-cyan-300" />
            Look Browser
          </div>
          <div className="grid gap-2">
            {liveVisualModules.map((module) => (
              <button
                key={module.id}
                type="button"
                onClick={() => chooseLook(module.presetId)}
                className={`rounded-md border p-3 text-left transition-colors ${
                  currentScene === module.id
                    ? 'border-white bg-white text-black'
                    : 'border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="text-[11px] font-black uppercase tracking-widest">{module.liveLabel}</div>
                <div className={`mt-1 text-[10px] leading-snug ${currentScene === module.id ? 'text-black/55' : 'text-white/35'}`}>{module.description}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/55">Look Memory</span>
              <button
                type="button"
                onClick={saveVisualMemory}
                className="flex h-8 items-center gap-1.5 rounded bg-white px-2 text-[10px] font-black uppercase tracking-widest text-black"
              >
                <Save size={13} />
                Save
              </button>
            </div>
            <div className="grid gap-2">
              {visualMemories.length === 0 ? (
                <div className="rounded border border-dashed border-white/10 p-3 text-[10px] leading-relaxed text-white/35">
                  Save Studio or Live looks here, then recall them during performance.
                </div>
              ) : visualMemories.slice(0, 6).map((memory, index) => (
                <button
                  key={memory.id}
                  type="button"
                  onClick={() => applyVisualMemory(memory.id)}
                  className="rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white/60 hover:bg-white hover:text-black"
                >
                  {index + 1}. {memory.name} / {memory.currentScene}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-white/10 bg-[#09090b] p-4">
          <div className="flex w-full max-w-[600px] items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Live Monitor</div>
              <div className="truncate text-[12px] font-black uppercase tracking-widest text-white">{currentScene}</div>
            </div>
            <button
              type="button"
              onClick={toggleFullscreenView}
              className="flex h-9 items-center gap-2 rounded-md bg-white px-3 text-[10px] font-black uppercase tracking-widest text-black"
            >
              <Maximize2 size={14} />
              Fullscreen
            </button>
          </div>
          <div className="relative w-full max-w-[600px] overflow-hidden rounded-lg border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)] aspect-video">
            <Visualizer />
            {initError && visualInputSource === 'mic' && (
              <div className="absolute left-3 top-3 z-50 rounded border border-red-400/30 bg-red-500/20 px-3 py-2 text-[11px] font-bold text-red-100">
                {initError}
              </div>
            )}
          </div>
          <div className="grid w-full max-w-[600px] grid-cols-3 gap-2">
            {[
              ['Level', meters.volume],
              ['Bass', meters.bass],
              ['Beat', meters.beat],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-md border border-white/10 bg-white/[0.035] p-2">
                <div className="mb-1 text-[9px] font-black uppercase tracking-widest text-white/35">{label as string}</div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.max(3, (value as number) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="min-h-0 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0d] p-4">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
            <Radio size={15} className="text-emerald-300" />
            Signal Panel
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sourceOptions.map((option) => (
              <button
                key={option.source}
                type="button"
                onClick={() => selectInputSource(option.source)}
                className={`h-10 rounded-md border text-[10px] font-black uppercase tracking-widest transition-colors ${
                  visualInputSource === option.source
                    ? 'border-emerald-300 bg-emerald-300 text-black'
                    : 'border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-md border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-white/50">Output Screen</span>
              <span className={activeScreen?.enabled ? 'text-emerald-300' : 'text-red-300'}>{activeScreen?.enabled ? 'Enabled' : 'Muted'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black">{activeScreen?.name || activeScreenId}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/35">{activeScreen?.device || 'stage'} / {activeScreenId}</div>
              </div>
              {activeScreen && (
                <button
                  type="button"
                  onClick={() => setScreenEnabled(activeScreen.id, !activeScreen.enabled)}
                  className="rounded bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/65 hover:bg-white hover:text-black"
                >
                  {activeScreen.enabled ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {LIVE_PAD_DEFINITIONS.map((pad) => (
              <LivePad
                key={pad.id}
                title={pad.title}
                subtitle={pad.subtitle}
                x={Number(liveControls[pad.xKey])}
                y={Number(liveControls[pad.yKey])}
                accent={pad.accent}
                xLabel={pad.xLabel}
                yLabel={pad.yLabel}
                onChange={(x, y) => updatePad(pad.id, x, y)}
              />
            ))}
          </div>

          <div className="mt-4 rounded-md border border-white/10 bg-white/[0.035] p-3 text-[10px] leading-relaxed text-white/38">
            Live controls shape the look without breaking audio follow. Detailed color, FX, camera, text and routing controls are in Studio.
          </div>
        </section>
      </main>
    </div>
  );
}
