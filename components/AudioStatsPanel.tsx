import type { AlgorithmMode, AudioFeatures } from '@/lib/types';

interface AudioStatsPanelProps {
  features: AudioFeatures;
  algorithmMode: AlgorithmMode;
}

const percent = (value: number) => `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
const formatFrequency = (value: number) => (value > 0 ? `${Math.round(value)} Hz` : '—');

function Meter({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{percent(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div className="meter-fill h-full rounded-full bg-gradient-to-r from-fuchsia-300 to-amber-200" style={{ width: percent(value) }} />
      </div>
    </div>
  );
}

export function AudioStatsPanel({ features, algorithmMode }: Readonly<AudioStatsPanelProps>) {
  return (
    <section className="glass-panel rounded-3xl p-4 sm:p-5" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="text-lg font-semibold text-white">Audio analysis</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/6 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Amplitude</p>
          <p className="mt-1 text-xl font-semibold text-white">{percent(Math.min(1, features.rms * 5))}</p>
        </div>
        <div className="rounded-2xl bg-white/6 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Dominant</p>
          <p className="mt-1 text-xl font-semibold text-white">{formatFrequency(features.dominantFrequency)}</p>
        </div>
        <div className="rounded-2xl bg-white/6 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Centroid</p>
          <p className="mt-1 text-xl font-semibold text-white">{formatFrequency(features.spectralCentroid)}</p>
        </div>
        <div className="rounded-2xl bg-white/6 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mode</p>
          <p className="mt-1 text-lg font-semibold text-white">{algorithmMode === 'sri-chakra' ? 'Sri Chakra' : 'Cymatics'}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Meter label="Low energy" value={features.lowEnergy} />
        <Meter label="Mid energy" value={features.midEnergy} />
        <Meter label="High energy" value={features.highEnergy} />
        <Meter label="Harmonic richness" value={features.harmonicRichness} />
        <Meter label="Om stability score" value={features.omScore} />
      </div>
    </section>
  );
}
