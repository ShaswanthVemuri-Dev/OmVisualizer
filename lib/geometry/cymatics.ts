import type { AudioFeatures, Point } from '../types';

const TAU = Math.PI * 2;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function createCymaticTargets(width: number, height: number, count: number, features: AudioFeatures, time: number): Point[] {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.43;
  const intensity = clamp01(features.rms * 1.2 + features.lowEnergy * 0.38 + features.midEnergy * 0.28);
  const frequencyRatio = Math.max(0.12, Math.min(2.8, features.dominantFrequency / 260));
  const symmetry = Math.max(4, Math.min(18, Math.round(4 + features.lowEnergy * 5 + features.midEnergy * 6 + features.harmonicRichness * 5)));
  const ringCount = Math.max(4, Math.min(13, Math.round(4 + features.spectralCentroid / 620 + features.harmonicRichness * 3)));
  const waveDepth = 0.12 + intensity * 0.34;
  const spin = time * (0.00008 + features.highEnergy * 0.00042 + intensity * 0.00018);

  return Array.from({ length: count }, (_, index) => {
    const normalized = index / count;
    const ring = (index % ringCount) + 1;
    const shell = ring / ringCount;
    const baseAngle = normalized * TAU * symmetry + spin;
    const nodal = Math.sin(baseAngle * symmetry + frequencyRatio * TAU + time * 0.0012) * waveDepth;
    const harmonic = Math.cos(baseAngle * (symmetry / 2 + 1.5) - time * 0.00042) * features.harmonicRichness * 0.18;
    const breathing = Math.sin(time * 0.003 + shell * TAU) * intensity * 0.08;
    const radial = radius * shell * (0.68 + nodal + harmonic + breathing);
    const cluster = 1 - Math.abs(Math.sin(baseAngle * symmetry)) * (0.10 + features.stability * 0.22);
    const skew = Math.sin(index * 0.17 + time * 0.001) * features.highEnergy * 14;

    return {
      x: cx + Math.cos(baseAngle) * radial * cluster + Math.cos(baseAngle * 3) * skew,
      y: cy + Math.sin(baseAngle) * radial * cluster + Math.sin(baseAngle * 2) * skew,
    };
  });
}

export function drawCymaticField(ctx: CanvasRenderingContext2D, width: number, height: number, features: AudioFeatures, time: number) {
  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height) * 0.09;
  const intensity = clamp01(features.rms * 1.35 + features.lowEnergy * 0.38 + features.midEnergy * 0.25);
  const rings = Math.max(4, Math.min(12, Math.round(4 + features.midEnergy * 6 + intensity * 4)));
  const spokes = Math.max(8, Math.min(32, Math.round(8 + features.harmonicRichness * 14 + features.lowEnergy * 10)));

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = Math.max(0.75, Math.min(width, height) * 0.0012 + intensity * 1.2);
  ctx.shadowColor = 'rgba(255, 205, 135, 0.42)';
  ctx.shadowBlur = 12 + intensity * 28;

  for (let ring = 1; ring <= rings; ring += 1) {
    const wobble = Math.sin(time * 0.0022 + ring * 1.9) * intensity * 26;
    const alpha = 0.08 + intensity * 0.22 + ring / rings * 0.04;
    ctx.strokeStyle = `rgba(255, 219, 157, ${alpha})`;
    ctx.beginPath();
    ctx.arc(cx, cy, base * ring + wobble, 0, TAU);
    ctx.stroke();
  }

  ctx.strokeStyle = `rgba(174, 226, 255, ${0.08 + intensity * 0.28})`;
  for (let spoke = 0; spoke < spokes; spoke += 1) {
    const angle = (spoke / spokes) * TAU + time * 0.00035;
    const inner = base * (1.2 + features.lowEnergy * 2);
    const outer = Math.min(width, height) * (0.28 + intensity * 0.17 + 0.06 * Math.sin(time * 0.002 + spoke));
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }

  const pulse = Math.min(width, height) * (0.035 + intensity * 0.07);
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse * 3.8);
  gradient.addColorStop(0, `rgba(255, 237, 189, ${0.22 + intensity * 0.36})`);
  gradient.addColorStop(0.48, `rgba(216, 143, 255, ${0.12 + intensity * 0.24})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, pulse * 3.8, 0, TAU);
  ctx.fill();

  ctx.restore();
}
