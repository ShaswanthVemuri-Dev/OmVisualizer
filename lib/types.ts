export type RecordingStatus =
  | 'Idle'
  | 'Requesting microphone access'
  | 'Listening'
  | 'Rendering final visual'
  | 'Complete';

export type VisualMode = 'live' | 'final';
export type AlgorithmMode = 'cymatics' | 'sri-chakra';

export interface AudioFeatures {
  rms: number;
  dominantFrequency: number;
  spectralCentroid: number;
  lowEnergy: number;
  midEnergy: number;
  highEnergy: number;
  harmonicRichness: number;
  stability: number;
  omScore: number;
}

export interface FinalAudioSummary extends AudioFeatures {
  maxRms: number;
  dominantFrequencyStability: number;
  sampleCount: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Particle extends Point {
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  alpha: number;
  size: number;
  phase: number;
}
