import type { AudioFeatures, Point } from '../types';

const TAU = Math.PI * 2;

export function createCymaticTargets(width: number, height: number, count: number, features: AudioFeatures, time: number): Point[] {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.42;
  const symmetry = Math.max(3, Math.min(14, Math.round(3 + features.lowEnergy * 4 + features.midEnergy * 5 + features.harmonicRichness * 4)));
  const ringCount = Math.max(3, Math.min(10, Math.round(3 + features.spectralCentroid / 850)));
  const waveDepth = 0.08 + features.rms * 0.9;

  return Array.from({ length: count }, (_, index) => {
    const normalized = index / count;
    const ring = (index % ringCount) + 1;
    const angle = normalized * TAU * symmetry + time * (0.00012 + features.highEnergy * 0.00035);
    const nodal = Math.sin(angle * symmetry + features.dominantFrequency * 0.012) * waveDepth;
    const harmonic = Math.cos(angle * (symmetry / 2 + 1) - time * 0.00018) * features.harmonicRichness * 0.1;
    const radial = radius * (ring / ringCount) * (0.72 + nodal + harmonic);
    const cluster = 1 - Math.abs(Math.sin(angle * symmetry)) * (0.12 + features.stability * 0.18);
    return {
      x: cx + Math.cos(angle) * radial * cluster,
      y: cy + Math.sin(angle) * radial * cluster,
    };
  });
}

export function drawCymaticField(ctx: CanvasRenderingContext2D, width: number, height: number, features: AudioFeatures, time: number) {
  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height) * 0.13;
  const rings = Math.max(3, Math.min(8, Math.round(3 + features.midEnergy * 5)));
  ctx.save();
  ctx.strokeStyle = 'rgba(186, 160, 255, 0.18)';
  ctx.lineWidth = Math.max(0.7, Math.min(width, height) * 0.0012);
  ctx.shadowColor = 'rgba(168, 120, 255, 0.3)';
  ctx.shadowBlur = 16;
  for (let ring = 1; ring <= rings; ring += 1) {
    const wobble = Math.sin(time * 0.0012 + ring) * features.rms * 18;
    ctx.beginPath();
    ctx.arc(cx, cy, base * ring + wobble, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}
