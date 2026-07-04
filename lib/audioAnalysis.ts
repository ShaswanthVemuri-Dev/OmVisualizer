import type { AudioFeatures, FinalAudioSummary } from './types';

const previousFrames: AudioFeatures[] = [];
const MAX_ROLLING_FRAMES = 56;

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
  let peak = 0;
  for (let index = startIndex; index <= endIndex; index += 1) {
    const magnitude = data[index] / 255;
    total += magnitude;
    peak = Math.max(peak, magnitude);
  }

  const mean = total / (endIndex - startIndex + 1);
  return clamp01(mean * 0.68 + peak * 0.32);
}

function estimateHarmonicRichness(data: Uint8Array, dominantIndex: number): number {
  if (dominantIndex <= 0) return 0;

  let harmonicEnergy = 0;
  let harmonicCount = 0;
  const baseEnergy = data[dominantIndex] / 255;

  for (let multiple = 2; multiple <= 7; multiple += 1) {
    const center = dominantIndex * multiple;
    if (center >= data.length) break;

    let local = 0;
    let samples = 0;
    for (let offset = -3; offset <= 3; offset += 1) {
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
  return clamp01((harmonicEnergy / harmonicCount) / Math.max(0.045, baseEnergy));
}

export function analyzeAudioFrame(
  frequencyData: Uint8Array,
  timeDomainData: Uint8Array,
  sampleRate: number,
): AudioFeatures {
  let squared = 0;
  let peakWave = 0;

  for (const sample of timeDomainData) {
    const normalized = (sample - 128) / 128;
    squared += normalized * normalized;
    peakWave = Math.max(peakWave, Math.abs(normalized));
  }

  const rawRms = Math.sqrt(squared / Math.max(1, timeDomainData.length));
  const visualRms = clamp01((rawRms - 0.004) / 0.075 + peakWave * 0.22);

  let dominantIndex = 0;
  let maxMagnitude = 0;
  let weightedSum = 0;
  let magnitudeSum = 0;
  const nyquist = sampleRate / 2;

  for (let index = 2; index < frequencyData.length; index += 1) {
    const frequency = (index / frequencyData.length) * nyquist;
    const magnitude = frequencyData[index] / 255;
    const weightedMagnitude = frequency >= 45 && frequency <= 2200 ? magnitude : magnitude * 0.28;

    if (weightedMagnitude > maxMagnitude) {
      maxMagnitude = weightedMagnitude;
      dominantIndex = index;
    }

    weightedSum += frequency * magnitude;
    magnitudeSum += magnitude;
  }

  const dominantFrequency = (dominantIndex / frequencyData.length) * nyquist;
  const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  const lowEnergy = bandEnergy(frequencyData, 40, 280, sampleRate);
  const midEnergy = bandEnergy(frequencyData, 280, 1600, sampleRate);
  const highEnergy = bandEnergy(frequencyData, 1600, 7200, sampleRate);
  const harmonicRichness = estimateHarmonicRichness(frequencyData, dominantIndex);

  const provisional: AudioFeatures = {
    rms: visualRms,
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

  const recent = previousFrames.filter((frame) => frame.rms > 0.035);
  const pitchValues = recent.map((frame) => frame.dominantFrequency).filter((frequency) => frequency > 55 && frequency < 750);
  const rmsValues = recent.map((frame) => frame.rms);

  const pitchMean = average(pitchValues);
  const pitchStd = Math.sqrt(variance(pitchValues));
  const envelopeStd = Math.sqrt(variance(rmsValues));
  const pitchStability = pitchValues.length > 8 ? clamp01(1 - pitchStd / Math.max(65, pitchMean)) : 0;
  const envelopeStability = rmsValues.length > 8 ? clamp01(1 - envelopeStd / Math.max(0.22, average(rmsValues))) : 0;
  const stability = clamp01(pitchStability * 0.58 + envelopeStability * 0.42);

  const fundamentalPreference = dominantFrequency >= 75 && dominantFrequency <= 460 ? 1 : dominantFrequency < 55 || dominantFrequency > 820 ? 0 : 0.48;
  const sustainedAmplitude = clamp01((average(rmsValues) - 0.045) / 0.44);
  const lowMidBalance = clamp01(lowEnergy * 0.82 + midEnergy * 0.48 - highEnergy * 0.34);
  const smoothCentroid = clamp01(1 - spectralCentroid / 5200);
  const rawOmScore = clamp01(
    sustainedAmplitude * 0.24 +
      fundamentalPreference * 0.16 +
      stability * 0.31 +
      harmonicRichness * 0.14 +
      lowMidBalance * 0.10 +
      smoothCentroid * 0.05,
  );
  const previousScore = previousFrames.length > 1 ? previousFrames[previousFrames.length - 2].omScore : 0;
  const attack = rawOmScore > previousScore ? 0.22 : 0.06;
  const omScore = clamp01(previousScore * (1 - attack) + rawOmScore * attack);

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

  const active = samples.filter((sample) => sample.rms > 0.035);
  const source = active.length ? active : samples;
  const dominantValues = source.map((sample) => sample.dominantFrequency).filter((value) => value > 0);
  const dominantMean = average(dominantValues);
  const dominantStd = Math.sqrt(variance(dominantValues));
  const dominantFrequencyStability = dominantValues.length > 2 ? clamp01(1 - dominantStd / Math.max(70, dominantMean)) : 0;
  const maxOm = Math.max(...source.map((sample) => sample.omScore));
  const avgOm = average(source.map((sample) => sample.omScore));

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
    omScore: clamp01(avgOm * 0.45 + maxOm * 0.55),
    sampleCount: source.length,
  };
}

export function resetAudioAnalysisHistory() {
  previousFrames.length = 0;
}
