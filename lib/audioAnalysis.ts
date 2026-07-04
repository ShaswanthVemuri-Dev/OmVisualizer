import type { AudioFeatures, FinalAudioSummary } from './types';

const previousFrames: AudioFeatures[] = [];
const MAX_ROLLING_FRAMES = 48;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const variance = (values: number[]) => {
  if (values.length < 2) return 0;
  const mean = average(values);
  return average(values.map((value) => (value - mean) ** 2));
};

function bandEnergy(data: Uint8Array, startHz: number, endHz: number, sampleRate: number): number {
  const nyquist = sampleRate / 2;
  const startIndex = Math.max(0, Math.floor((startHz / nyquist) * data.length));
  const endIndex = Math.min(data.length - 1, Math.ceil((endHz / nyquist) * data.length));
  if (endIndex <= startIndex) return 0;
  let total = 0;
  for (let index = startIndex; index <= endIndex; index += 1) total += data[index] / 255;
  return total / (endIndex - startIndex + 1);
}

function estimateHarmonicRichness(data: Uint8Array, dominantIndex: number): number {
  if (dominantIndex <= 0) return 0;
  let harmonicEnergy = 0;
  let harmonicCount = 0;
  const baseEnergy = data[dominantIndex] / 255;
  for (let multiple = 2; multiple <= 6; multiple += 1) {
    const center = dominantIndex * multiple;
    if (center >= data.length) break;
    let local = 0;
    let samples = 0;
    for (let offset = -2; offset <= 2; offset += 1) {
      const index = center + offset;
      if (index >= 0 && index < data.length) {
        local += data[index] / 255;
        samples += 1;
      }
    }
    harmonicEnergy += samples ? local / samples : 0;
    harmonicCount += 1;
  }
  if (!harmonicCount) return 0;
  return clamp01((harmonicEnergy / harmonicCount) / Math.max(0.08, baseEnergy));
}

export function analyzeAudioFrame(
  frequencyData: Uint8Array,
  timeDomainData: Uint8Array,
  sampleRate: number,
): AudioFeatures {
  let squared = 0;
  for (const sample of timeDomainData) {
    const normalized = (sample - 128) / 128;
    squared += normalized * normalized;
  }
  const rms = Math.sqrt(squared / Math.max(1, timeDomainData.length));

  let dominantIndex = 0;
  let maxMagnitude = 0;
  let weightedSum = 0;
  let magnitudeSum = 0;
  const nyquist = sampleRate / 2;

  for (let index = 1; index < frequencyData.length; index += 1) {
    const magnitude = frequencyData[index] / 255;
    const frequency = (index / frequencyData.length) * nyquist;
    if (magnitude > maxMagnitude) {
      maxMagnitude = magnitude;
      dominantIndex = index;
    }
    weightedSum += frequency * magnitude;
    magnitudeSum += magnitude;
  }

  const dominantFrequency = (dominantIndex / frequencyData.length) * nyquist;
  const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  const lowEnergy = bandEnergy(frequencyData, 20, 300, sampleRate);
  const midEnergy = bandEnergy(frequencyData, 300, 1800, sampleRate);
  const highEnergy = bandEnergy(frequencyData, 1800, 8000, sampleRate);
  const harmonicRichness = estimateHarmonicRichness(frequencyData, dominantIndex);

  const provisional: AudioFeatures = {
    rms,
    dominantFrequency,
    spectralCentroid,
    lowEnergy,
    midEnergy,
    highEnergy,
    harmonicRichness,
    stability: 0,
    omScore: 0,
  };

  previousFrames.push(provisional);
  if (previousFrames.length > MAX_ROLLING_FRAMES) previousFrames.shift();

  const recent = previousFrames.filter((frame) => frame.rms > 0.015);
  const pitchValues = recent.map((frame) => frame.dominantFrequency).filter((frequency) => frequency > 50 && frequency < 900);
  const rmsValues = recent.map((frame) => frame.rms);

  const pitchMean = average(pitchValues);
  const pitchStd = Math.sqrt(variance(pitchValues));
  const envelopeStd = Math.sqrt(variance(rmsValues));
  const pitchStability = pitchValues.length > 6 ? clamp01(1 - pitchStd / Math.max(80, pitchMean)) : 0;
  const envelopeStability = rmsValues.length > 6 ? clamp01(1 - envelopeStd / Math.max(0.04, average(rmsValues))) : 0;
  const stability = clamp01(pitchStability * 0.58 + envelopeStability * 0.42);

  const fundamentalPreference = dominantFrequency >= 80 && dominantFrequency <= 420 ? 1 : dominantFrequency < 60 || dominantFrequency > 700 ? 0 : 0.45;
  const sustainedAmplitude = clamp01((average(rmsValues) - 0.018) / 0.11);
  const lowMidBalance = clamp01((lowEnergy * 0.65 + midEnergy * 0.45) - highEnergy * 0.55);
  const smoothCentroid = clamp01(1 - spectralCentroid / 4200);
  const rawOmScore = clamp01(
    sustainedAmplitude * 0.24 +
      fundamentalPreference * 0.2 +
      stability * 0.24 +
      harmonicRichness * 0.18 +
      lowMidBalance * 0.08 +
      smoothCentroid * 0.06,
  );
  const previousScore = previousFrames.length > 1 ? previousFrames[previousFrames.length - 2].omScore : 0;
  const omScore = clamp01(previousScore * 0.88 + rawOmScore * 0.12);

  provisional.stability = stability;
  provisional.omScore = omScore;
  return provisional;
}

export function aggregateAudioFeatures(samples: AudioFeatures[]): FinalAudioSummary {
  if (!samples.length) {
    return {
      rms: 0,
      maxRms: 0,
      dominantFrequency: 0,
      spectralCentroid: 0,
      lowEnergy: 0,
      midEnergy: 0,
      highEnergy: 0,
      harmonicRichness: 0,
      stability: 0,
      dominantFrequencyStability: 0,
      omScore: 0,
      sampleCount: 0,
    };
  }

  const active = samples.filter((sample) => sample.rms > 0.012);
  const source = active.length ? active : samples;
  const dominantValues = source.map((sample) => sample.dominantFrequency).filter((value) => value > 0);
  const dominantMean = average(dominantValues);
  const dominantStd = Math.sqrt(variance(dominantValues));
  const dominantFrequencyStability = dominantValues.length > 2 ? clamp01(1 - dominantStd / Math.max(80, dominantMean)) : 0;

  return {
    rms: average(source.map((sample) => sample.rms)),
    maxRms: Math.max(...source.map((sample) => sample.rms)),
    dominantFrequency: dominantMean,
    spectralCentroid: average(source.map((sample) => sample.spectralCentroid)),
    lowEnergy: average(source.map((sample) => sample.lowEnergy)),
    midEnergy: average(source.map((sample) => sample.midEnergy)),
    highEnergy: average(source.map((sample) => sample.highEnergy)),
    harmonicRichness: average(source.map((sample) => sample.harmonicRichness)),
    stability: average(source.map((sample) => sample.stability)),
    dominantFrequencyStability,
    omScore: clamp01(average(source.map((sample) => sample.omScore)) * 0.55 + Math.max(...source.map((sample) => sample.omScore)) * 0.45),
    sampleCount: source.length,
  };
}

export function resetAudioAnalysisHistory() {
  previousFrames.length = 0;
}
