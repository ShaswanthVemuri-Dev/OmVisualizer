'use client';

import type { AlgorithmMode, RecordingStatus, VisualMode } from '@/lib/types';

interface ControlsProps {
  status: RecordingStatus;
  visualMode: VisualMode;
  algorithmMode: AlgorithmMode;
  isRecording: boolean;
  hasFinalVisual: boolean;
  errorMessage: string;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onDownload: () => void;
  onVisualModeChange: (mode: VisualMode) => void;
  onAlgorithmModeChange: (mode: AlgorithmMode) => void;
}

function SegmentedButton<T extends string>({
  value,
  current,
  onClick,
  children,
}: Readonly<{ value: T; current: T; onClick: (value: T) => void; children: React.ReactNode }>) {
  const selected = value === current;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onClick(value)}
      className={`min-h-11 flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-200/80 ${
        selected ? 'bg-amber-200 text-slate-950 shadow-lg shadow-amber-200/15' : 'bg-white/6 text-slate-200 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

export function Controls(props: Readonly<ControlsProps>) {
  const {
    status,
    visualMode,
    algorithmMode,
    isRecording,
    hasFinalVisual,
    errorMessage,
    onStart,
    onStop,
    onClear,
    onDownload,
    onVisualModeChange,
    onAlgorithmModeChange,
  } = props;

  return (
    <section className="glass-panel rounded-3xl p-4 sm:p-5" aria-labelledby="controls-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 id="controls-heading" className="text-lg font-semibold text-white">Controls</h2>
          <p aria-live="polite" className="mt-1 text-sm text-slate-300">Status: {status}</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${isRecording ? 'bg-emerald-300 shadow-lg shadow-emerald-300/70' : 'bg-slate-500'}`} />
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Visualization mode</p>
          <div className="flex gap-2 rounded-2xl bg-black/24 p-1">
            <SegmentedButton value="live" current={visualMode} onClick={onVisualModeChange}>Live Mode</SegmentedButton>
            <SegmentedButton value="final" current={visualMode} onClick={onVisualModeChange}>Final Render</SegmentedButton>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Algorithm mode</p>
          <div className="flex gap-2 rounded-2xl bg-black/24 p-1">
            <SegmentedButton value="cymatics" current={algorithmMode} onClick={onAlgorithmModeChange}>Cymatics</SegmentedButton>
            <SegmentedButton value="sri-chakra" current={algorithmMode} onClick={onAlgorithmModeChange}>Sri Chakra</SegmentedButton>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {!isRecording ? (
            <button
              type="button"
              aria-label="Speak and start microphone visualization"
              onClick={onStart}
              className="min-h-14 rounded-2xl bg-gradient-to-r from-amber-200 to-fuchsia-200 px-5 py-3 text-base font-bold text-slate-950 shadow-lg shadow-fuchsia-400/15 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-amber-100"
            >
              Speak
            </button>
          ) : (
            <button
              type="button"
              aria-label="Stop recording"
              onClick={onStop}
              className="min-h-14 rounded-2xl bg-rose-400 px-5 py-3 text-base font-bold text-slate-950 shadow-lg shadow-rose-400/20 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-rose-100"
            >
              Stop
            </button>
          )}

          <button
            type="button"
            aria-label="Clear the current visual"
            onClick={onClear}
            className="min-h-14 rounded-2xl border border-white/12 bg-white/7 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-slate-200/70"
          >
            Clear Visual
          </button>
        </div>

        <button
          type="button"
          aria-label="Download the visualization as a PNG image"
          onClick={onDownload}
          disabled={!hasFinalVisual && !isRecording}
          className="min-h-12 w-full rounded-2xl border border-amber-200/30 bg-amber-200/10 px-4 py-3 font-semibold text-amber-100 transition hover:bg-amber-200/16 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Download Image
        </button>

        {errorMessage ? (
          <div role="alert" className="rounded-2xl border border-rose-300/25 bg-rose-500/12 p-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </section>
  );
}
