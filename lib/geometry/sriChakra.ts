import type { Point } from '../types';

const TAU = Math.PI * 2;

function sampleLine(a: Point, b: Point, density: number): Point[] {
  const distance = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(2, Math.floor(distance * density));
  const points: Point[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return points;
}

function trianglePoints(cx: number, cy: number, radius: number, rotation: number): Point[] {
  return [0, 1, 2].map((index) => {
    const angle = rotation + index * (TAU / 3);
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
}

function samplePolygon(vertices: Point[], density: number): Point[] {
  return vertices.flatMap((point, index) => sampleLine(point, vertices[(index + 1) % vertices.length], density));
}

function sampleCircle(cx: number, cy: number, radius: number, samples: number): Point[] {
  return Array.from({ length: samples }, (_, index) => {
    const angle = (index / samples) * TAU;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
}

function samplePetals(cx: number, cy: number, radius: number, count: number, samplesPerPetal: number): Point[] {
  const points: Point[] = [];
  for (let petal = 0; petal < count; petal += 1) {
    const base = (petal / count) * TAU;
    for (let sample = 0; sample < samplesPerPetal; sample += 1) {
      const local = (sample / samplesPerPetal) * TAU;
      const petalRadius = radius * (0.86 + 0.18 * Math.sin(local));
      const angle = base + Math.sin(local) * 0.135;
      points.push({ x: cx + Math.cos(angle) * petalRadius, y: cy + Math.sin(angle) * petalRadius });
    }
  }
  return points;
}

export function createSriChakraPoints(width: number, height: number, count: number): Point[] {
  const size = Math.min(width, height) * 0.78;
  const cx = width / 2;
  const cy = height / 2;
  const density = Math.max(0.08, count / 78000);
  const points: Point[] = [];

  points.push(...sampleCircle(cx, cy, size * 0.035, Math.max(16, Math.floor(count * 0.015))));
  points.push(...sampleCircle(cx, cy, size * 0.21, Math.max(64, Math.floor(count * 0.06))));
  points.push(...sampleCircle(cx, cy, size * 0.31, Math.max(96, Math.floor(count * 0.08))));
  points.push(...sampleCircle(cx, cy, size * 0.42, Math.max(128, Math.floor(count * 0.1))));
  points.push(...samplePetals(cx, cy, size * 0.325, 8, Math.max(12, Math.floor(count / 170))));
  points.push(...samplePetals(cx, cy, size * 0.43, 16, Math.max(8, Math.floor(count / 260))));

  const triangleSpecs = [
    { scale: 0.42, rotation: -Math.PI / 2, y: -0.015 },
    { scale: 0.38, rotation: Math.PI / 2, y: 0.025 },
    { scale: 0.32, rotation: -Math.PI / 2, y: 0.075 },
    { scale: 0.3, rotation: Math.PI / 2, y: -0.065 },
    { scale: 0.25, rotation: -Math.PI / 2, y: -0.002 },
    { scale: 0.23, rotation: Math.PI / 2, y: 0.008 },
    { scale: 0.18, rotation: -Math.PI / 2, y: 0.04 },
    { scale: 0.16, rotation: Math.PI / 2, y: -0.034 },
    { scale: 0.12, rotation: -Math.PI / 2, y: 0.0 },
  ];

  for (const spec of triangleSpecs) {
    points.push(...samplePolygon(trianglePoints(cx, cy + size * spec.y, size * spec.scale, spec.rotation), density));
  }

  const square = size * 0.54;
  const gate = square * 0.18;
  const left = cx - square;
  const right = cx + square;
  const top = cy - square;
  const bottom = cy + square;
  const bhupura: Point[][] = [
    [{ x: left, y: top }, { x: cx - gate, y: top }],
    [{ x: cx + gate, y: top }, { x: right, y: top }],
    [{ x: right, y: top }, { x: right, y: cy - gate }],
    [{ x: right, y: cy + gate }, { x: right, y: bottom }],
    [{ x: right, y: bottom }, { x: cx + gate, y: bottom }],
    [{ x: cx - gate, y: bottom }, { x: left, y: bottom }],
    [{ x: left, y: bottom }, { x: left, y: cy + gate }],
    [{ x: left, y: cy - gate }, { x: left, y: top }],
  ];
  for (const [a, b] of bhupura) points.push(...sampleLine(a, b, density));

  while (points.length < count) points.push(points[points.length % Math.max(1, points.length)] ?? { x: cx, y: cy });
  return points.slice(0, count);
}

export function drawSriChakraGuide(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number) {
  if (alpha <= 0.01) return;
  const points = createSriChakraPoints(width, height, 1100);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.68)';
  ctx.fillStyle = 'rgba(255, 244, 205, 0.92)';
  ctx.lineWidth = Math.max(0.8, Math.min(width, height) * 0.0014);
  ctx.shadowColor = 'rgba(255, 190, 95, 0.52)';
  ctx.shadowBlur = 14;

  for (let i = 0; i < points.length - 1; i += 2) {
    const a = points[i];
    const b = points[i + 1];
    if (Math.hypot(a.x - b.x, a.y - b.y) < Math.min(width, height) * 0.08) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.011, 0, TAU);
  ctx.fill();
  ctx.restore();
}
