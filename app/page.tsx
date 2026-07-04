'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioStatsPanel } from '@/components/AudioStatsPanel';
import { Controls } from '@/components/Controls';
import { ExplanationPanel } from '@/components/ExplanationPanel';
import { VisualizerCanvas, type VisualizerCanvasHandle } from '@/components/VisualizerCanvas';
import { aggregateAudioFeatures, analyzeAudioFrame, resetAudioAnalysisHistory } from '@/lib/audioAnalysis';
import type { AlgorithmMode, AudioFeatures, RecordingStatus, VisualMode } from '@/lib/types';

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

function browserSupportsAudio() {
  return typeof window !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && Boolean(window.AudioContext || window.webkitAudioContext);
}

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [status, setStatus] = useState<RecordingStatus>('Idle');
  const [visualMode, setVisualMode] = useState<VisualMode>('live');
  const [algorithmMode, setAlgorithmMode] = useState<AlgorithmMode>('sri-chakra');
  const [features, setFeatures] = useState<AudioFeatures>(EMPTY_FEATURES);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasFinalVisual, setHasFinalVisual] = useState(false);

  const canvasRef = useRef<VisualizerCanvasHandle | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const samplesRef = useRef<AudioFeatures[]>([]);

  const cleanupAudio = useCallback(async () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    sourceRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== 'closed') {
      try {
        await context.close();
      } catch {
        // Some browsers throw when closing an already-closing AudioContext.
      }
    }
  }, []);

  useEffect(() => () => {
    void cleanupAudio();
  }, [cleanupAudio]);

  const analyzeLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const context = audioContextRef.current;
    if (!analyser || !context) return;

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeDomainData = new Uint8Array(analyser.fftSize);

    const tick = () => {
      const activeAnalyser = analyserRef.current;
      const activeContext = audioContextRef.current;
      if (!activeAnalyser || !activeContext) return;
      activeAnalyser.getByteFrequencyData(frequencyData);
      activeAnalyser.getByteTimeDomainData(timeDomainData);
      const nextFeatures = analyzeAudioFrame(frequencyData, timeDomainData, activeContext.sampleRate);
      setFeatures(nextFeatures);
      samplesRef.current.push(nextFeatures);
      if (samplesRef.current.length > 1800) samplesRef.current.shift();
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMessage('');
    setHasStarted(true);
    setHasFinalVisual(false);
    canvasRef.current?.clear();

    if (!browserSupportsAudio()) {
      setErrorMessage('This browser does not support microphone-based Web Audio visualization. Please use a current mobile or desktop browser.');
      setStatus('Idle');
      return;
    }

    await cleanupAudio();
    resetAudioAnalysisHistory();
    samplesRef.current = [];
    setFeatures(EMPTY_FEATURES);
    setStatus('Requesting microphone access');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextConstructor();
      if (audioContext.state === 'suspended') await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      setIsRecording(true);
      setStatus('Listening');
      analyzeLoop();
    } catch (error) {
      await cleanupAudio();
      setIsRecording(false);
      setStatus('Idle');
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access is required to generate live visuals. Please enable microphone permission in your browser settings.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone was found. Connect or enable a microphone and try again.');
      } else {
        setErrorMessage('Unable to start microphone visualization. Please refresh the page and try again.');
      }
    }
  }, [analyzeLoop, cleanupAudio]);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    if (visualMode === 'final') setStatus('Rendering final visual');
    await cleanupAudio();

    if (visualMode === 'final') {
      const summary = aggregateAudioFeatures(samplesRef.current);
      setFeatures(summary);
      canvasRef.current?.renderFinal(summary);
      setStatus('Complete');
      return;
    }

    setStatus('Complete');
  }, [cleanupAudio, visualMode]);

  const clearVisual = useCallback(() => {
    samplesRef.current = [];
    setFeatures(EMPTY_FEATURES);
    setStatus('Idle');
    setErrorMessage('');
    setHasFinalVisual(false);
    canvasRef.current?.clear();
  }, []);

  const downloadImage = useCallback(() => {
    canvasRef.current?.downloadPng();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between py-3" aria-label="Application header">
        <a href="#top" className="text-sm font-semibold tracking-[0.22em] text-amber-100">OM CYMATICS</a>
        <a href="#visualizer" className="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/8">Open visualizer</a>
      </header>

      <section id="top" className={`mx-auto grid max-w-7xl items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] ${hasStarted ? 'lg:py-8' : 'min-h-[72vh]'}`}>
        <div>
          <p className="mb-4 inline-flex rounded-full border border-amber-200/20 bg-amber-200/8 px-4 py-2 text-sm text-amber-100">Live audio sacred geometry</p>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">Om Cymatics Visualizer</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">Speak or chant into the microphone and watch the visual field react in real time.</p>
          <p className="mt-4 max-w-2xl rounded-2xl border border-amber-200/20 bg-black/20 p-4 text-sm leading-6 text-amber-50">Sri Chakra Mode follows a stable Om-like chant and resolves the particles into a Sri Chakra-inspired form.</p>
          <button
            type="button"
            onClick={() => {
              setHasStarted(true);
              document.getElementById('visualizer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="mt-7 rounded-2xl bg-gradient-to-r from-amber-200 to-fuchsia-200 px-6 py-4 text-base font-bold text-slate-950 shadow-xl shadow-fuchsia-400/15 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-amber-100"
          >
            Start Visualizing
          </button>
        </div>
        <div className="glass-panel glow-border rounded-[2rem] p-5">
          <div className="aspect-square rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle,rgba(255,221,155,0.24),rgba(121,77,201,0.15)_38%,rgba(0,0,0,0.22)_72%)] p-8">
            <div className="flex h-full items-center justify-center rounded-full border border-amber-100/20">
              <div className="flex h-2/3 w-2/3 items-center justify-center rounded-full border border-fuchsia-200/20">
                <div className="h-5 w-5 rounded-full bg-amber-100 shadow-[0_0_40px_rgba(255,230,170,0.9)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="visualizer" className="mx-auto grid max-w-7xl gap-5 pb-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]" aria-label="Main visualizer">
        <div className="min-w-0">
          <VisualizerCanvas
            ref={canvasRef}
            features={features}
            visualMode={visualMode}
            algorithmMode={algorithmMode}
            isRecording={isRecording}
            onFinalVisualChange={setHasFinalVisual}
          />
        </div>
        <div className="grid gap-5 self-start">
          <Controls
            status={status}
            visualMode={visualMode}
            algorithmMode={algorithmMode}
            isRecording={isRecording}
            hasFinalVisual={hasFinalVisual}
            errorMessage={errorMessage}
            onStart={startRecording}
            onStop={stopRecording}
            onClear={clearVisual}
            onDownload={downloadImage}
            onVisualModeChange={setVisualMode}
            onAlgorithmModeChange={setAlgorithmMode}
          />
          <AudioStatsPanel features={features} algorithmMode={algorithmMode} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 pb-12 lg:grid-cols-2">
        <ExplanationPanel />
        <section className="glass-panel rounded-3xl p-4 sm:p-5" aria-labelledby="principles-heading">
          <h2 id="principles-heading" className="text-lg font-semibold text-white">Signal engine</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>The microphone signal directly drives the canvas through amplitude, frequency, harmonics, and energy bands.</li>
            <li>Final Render Mode captures the chant profile and holds the completed pattern on screen.</li>
            <li>Particle density scales automatically across phones, tablets, and desktops.</li>
            <li>PNG export captures the current canvas state for saving or sharing.</li>
          </ul>
        </section>
      </section>

      <footer className="mx-auto max-w-7xl border-t border-white/10 py-6 text-sm text-slate-400">
        <p>Om Cymatics Visualizer — live browser-based sound geometry. Microphone access runs securely over HTTPS.</p>
      </footer>
    </main>
  );
}
