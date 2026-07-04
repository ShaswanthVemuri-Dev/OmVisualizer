'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createCymaticTargets, drawCymaticField } from '@/lib/geometry/cymatics';
import { createSriChakraPoints, drawSriChakraGuide } from '@/lib/geometry/sriChakra';
import type { AlgorithmMode, AudioFeatures, FinalAudioSummary, Particle, VisualMode } from '@/lib/types';

export interface VisualizerCanvasHandle {
  downloadPng: () => void;
  clear: () => void;
  renderFinal: (summary: FinalAudioSummary) => void;
}

interface VisualizerCanvasProps {
  features: AudioFeatures;
  visualMode: VisualMode;
  algorithmMode: AlgorithmMode;
  isRecording: boolean;
  onFinalVisualChange: (value: boolean) => void;
}

const EMPTY_FEATURES: AudioFeatures = {
  rms: 0,
  dominantFrequency: 0,
  spectralCentroid: 0,
  lowEnergy: 0,
  midEnergy: 0,
  highEnergy: 0,
  harmonicRichness: 0,
  stability: 0,
  omScore: 0,
};

function getParticleCount(width: number): number {
  if (width < 520) return 900;
  if (width < 920) return 1400;
  return 2400;
}

function createParticles(count: number, width: number, height: number): Particle[] {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.45;
  return Array.from({ length: count }, (_, index) => {
    const angle = index * 2.399963229728653;
    const radius = Math.sqrt(index / count) * maxRadius;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      tx: cx,
      ty: cy,
      alpha: 0.68 + Math.random() * 0.14,
      size: 1.0 + Math.random() * 0.08,
      phase: Math.random() * Math.PI * 2,
    };
  });
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, Math.max(width, height) * 0.72);
  gradient.addColorStop(0, 'rgba(42, 28, 62, 0.42)');
  gradient.addColorStop(0.55, 'rgba(8, 7, 21, 0.96)');
  gradient.addColorStop(1, 'rgba(5, 3, 12, 1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[], features: AudioFeatures, settled: boolean) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (const particle of particles) {
    const grainSize = particle.size;
    ctx.globalAlpha = settled ? Math.min(0.9, particle.alpha + 0.06) : particle.alpha;
    ctx.fillStyle = features.omScore > 0.55 ? 'rgba(246, 235, 205, 0.82)' : 'rgba(220, 212, 255, 0.72)';
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, grainSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const VisualizerCanvas = forwardRef<VisualizerCanvasHandle, VisualizerCanvasProps>(function VisualizerCanvas(
  { features, visualMode, algorithmMode, isRecording, onFinalVisualChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const dimensionsRef = useRef({ width: 900, height: 700, dpr: 1 });
  const featuresRef = useRef<AudioFeatures>(EMPTY_FEATURES);
  const modeRef = useRef({ visualMode, algorithmMode, isRecording });
  const finalSummaryRef = useRef<FinalAudioSummary | null>(null);
  const hasFinalRef = useRef(false);

  useEffect(() => {
    featuresRef.current = features;
  }, [features]);

  useEffect(() => {
    modeRef.current = { visualMode, algorithmMode, isRecording };
    if (isRecording) {
      finalSummaryRef.current = null;
      hasFinalRef.current = false;
      onFinalVisualChange(false);
    }
  }, [visualMode, algorithmMode, isRecording, onFinalVisualChange]);

  useImperativeHandle(ref, () => ({
    downloadPng: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `om-cymatics-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    },
    clear: () => {
      finalSummaryRef.current = null;
      hasFinalRef.current = false;
      onFinalVisualChange(false);
      const { width, height } = dimensionsRef.current;
      particlesRef.current = createParticles(getParticleCount(width), width, height);
    },
    renderFinal: (summary: FinalAudioSummary) => {
      finalSummaryRef.current = summary;
      featuresRef.current = summary;
      hasFinalRef.current = true;
      onFinalVisualChange(true);
    },
  }), [onFinalVisualChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(360, Math.floor(Math.min(rect.width * 0.78, window.innerHeight * 0.68)));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimensionsRef.current = { width, height, dpr };
      particlesRef.current = createParticles(getParticleCount(width), width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const animate = (time: number) => {
      const { width, height } = dimensionsRef.current;
      const mode = modeRef.current;
      const liveFeatures = featuresRef.current;
      const finalSummary = finalSummaryRef.current;
      const activeFeatures = finalSummary ?? liveFeatures;
      const morphProgress = mode.algorithmMode === 'sri-chakra' ? activeFeatures.omScore : 0;
      const resolvedMorph = mode.algorithmMode === 'sri-chakra' ? Math.min(1, activeFeatures.omScore * 1.28) : 0;
      const settled = Boolean(finalSummary);
      const particles = particlesRef.current;

      drawBackground(ctx, width, height);
      drawCymaticField(ctx, width, height, activeFeatures, time);

      const cymaticTargets = createCymaticTargets(width, height, particles.length, activeFeatures, time);
      const sriTargets = mode.algorithmMode === 'sri-chakra' ? createSriChakraPoints(width, height, particles.length) : cymaticTargets;
      const chaos = settled ? 0.02 : Math.max(0.03, (1 - resolvedMorph) ** 1.85);

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const cymatic = cymaticTargets[index];
        const sri = sriTargets[index];
        const jitterAngle = particle.phase + time * 0.0011 + index * 0.013;
        const jitterRadius = chaos * (2 + activeFeatures.rms * 20 + activeFeatures.highEnergy * 8);
        const tx = cymatic.x * (1 - resolvedMorph) + sri.x * resolvedMorph + Math.cos(jitterAngle) * jitterRadius;
        const ty = cymatic.y * (1 - resolvedMorph) + sri.y * resolvedMorph + Math.sin(jitterAngle) * jitterRadius;
        const attraction = settled ? 0.22 : 0.07 + activeFeatures.stability * 0.08 + resolvedMorph * 0.14 + activeFeatures.rms * 0.02;
        particle.vx = (particle.vx + (tx - particle.x) * attraction) * 0.76;
        particle.vy = (particle.vy + (ty - particle.y) * attraction) * 0.76;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.tx = tx;
        particle.ty = ty;
      }

      if (mode.algorithmMode === 'sri-chakra') {
        drawSriChakraGuide(
          ctx,
          width,
          height,
          settled ? Math.max(0.42, morphProgress * 0.92) : Math.max(0.12, morphProgress * 0.68),
        );
      }
      renderParticles(ctx, particles, activeFeatures, settled);

      if (settled && mode.visualMode === 'final') {
        hasFinalRef.current = true;
        onFinalVisualChange(true);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [onFinalVisualChange]);

  return (
    <div ref={containerRef} className="glow-border relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 p-2 sm:p-3" aria-label="Cymatics visualization canvas container">
      <canvas ref={canvasRef} className="block w-full rounded-[1.55rem]" role="img" aria-label="Real-time cymatics-inspired sacred geometry visualization" />
      <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200 backdrop-blur-md">
        {isRecording ? 'Listening to live audio' : algorithmMode === 'sri-chakra' ? 'Sri Chakra Mode' : 'Cymatics Mode'}
      </div>
    </div>
  );
});
