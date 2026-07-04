# Om Cymatics Visualizer

A production-ready responsive web app that creates cymatics-inspired sacred-geometry visuals from microphone input or an uploaded sound file.

The primary calibration test case is a clean, stable **Om / Aum** chant. In **Sri Chakra Mode**, a stable Om-like sustained tone progressively morphs the visualization toward a Sri Chakra / Sri Yantra-inspired final geometry.

> Scientific disclaimer: this app is a symbolic, cymatics-inspired, and sacred-geometry visualization. It does **not** claim laboratory proof that Om physically creates Sri Chakra.

## Features

- Next.js App Router with TypeScript
- React functional components
- Tailwind CSS responsive UI
- Web Audio API microphone capture and analysis
- Optional audio file upload for final rendering
- Canvas 2D rendering with `requestAnimationFrame`
- Device-pixel-ratio-aware crisp canvas rendering
- Mobile, tablet, laptop, and desktop responsive layouts
- Live Mode for continuous motion
- Final Render Mode for a static saved visual after recording/uploading
- Cymatics Mode using frequency, amplitude, harmonics, and resonance-style nodal patterns
- Sri Chakra Mode using an Om stability score to morph toward symbolic sacred geometry
- Programmatic Sri Chakra-inspired geometry: bindu, interlocking triangles, circular rings, petals, and bhupura-inspired square frame
- Dynamic particle count by viewport size for mobile performance
- Graceful microphone permission errors
- PNG download support
- Vercel-ready deployment

## Tech stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- Web Audio API
- Canvas 2D
- Vercel

## Algorithm overview

### Audio analysis

`lib/audioAnalysis.ts` exposes:

```ts
analyzeAudioFrame(frequencyData, timeDomainData, sampleRate)
```

It returns:

```ts
{
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
```

The app uses an `AnalyserNode` to read frequency-domain and time-domain frames. It computes RMS amplitude, dominant frequency, spectral centroid, band energy, harmonic richness, rolling frequency/envelope stability, and a smoothed Om stability score.

### Cymatics Mode

Cymatics Mode is not hardcoded to Sri Chakra. It uses amplitude, frequency, centroid, band energy, and harmonics to drive:

- radial waves
- nodal rings
- symmetry count
- particle clustering
- harmonic line structures

### Sri Chakra Mode

Sri Chakra Mode is calibrated and symbolic. It favors:

- sustained amplitude
- lower/mid vocal dominant frequency
- smooth pitch contour
- stable envelope
- harmonic richness
- longer vowel-like sustained tone

A clean, stable Om-like input raises `omScore`. Higher `omScore` increases `morphProgress`, moving particles from chaotic cymatic targets toward Sri Chakra-inspired geometry targets.

Random noise should remain more chaotic and should not fully resolve.

## Project structure

```txt
app/
  globals.css
  layout.tsx
  page.tsx
components/
  AudioStatsPanel.tsx
  Controls.tsx
  ExplanationPanel.tsx
  VisualizerApp.tsx
  VisualizerCanvas.tsx
lib/
  audioAnalysis.ts
  types.ts
  geometry/
    cymatics.ts
    sriChakra.ts
README.md
package.json
tailwind.config.ts
postcss.config.mjs
next.config.mjs
tsconfig.json
```

## Local setup

```bash
npm install
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Build

```bash
npm run build
```

## Deployment on Vercel

```bash
npm install
npm run build
vercel
```

Microphone access requires a secure context. `localhost` works in development, and Vercel provides HTTPS in production.

## GitHub setup

If the repository was not created automatically, create and push it manually:

```bash
git init
git add .
git commit -m "Initial Om Cymatics Visualizer app"
git branch -M main
gh repo create om-cymatics-visualizer --public --source=. --remote=origin --push
```

If `gh` is not authenticated:

```bash
gh auth login
gh repo create om-cymatics-visualizer --public --source=. --remote=origin --push
```

Or create a public repository named `om-cymatics-visualizer` in GitHub, then run:

```bash
git remote add origin https://github.com/<your-username>/om-cymatics-visualizer.git
git push -u origin main
```

## Manual test checklist

- App loads without runtime errors.
- Layout has no horizontal scrolling on mobile.
- Canvas stays centered and scales on mobile, tablet, and desktop.
- Desktop uses a two-column visualizer layout.
- Speak button opens the browser microphone permission prompt.
- Denying microphone permission shows a helpful error and does not crash the app.
- Live Mode reacts to voice input in real time.
- Stop button releases microphone tracks.
- Final Render Mode records, aggregates audio features, and holds a final visual.
- Clear Visual resets the canvas and stats.
- Download Image exports a PNG.
- Cymatics Mode produces organic nodal/radial patterns and is not hardcoded to Sri Chakra.
- Sri Chakra Mode stays chaotic for random noise.
- Sri Chakra Mode converges toward a Sri Chakra-inspired result during a clean, stable Om-like chant.
- Uploaded audio produces a final visual.
- `npm run build` completes successfully.

## Known limitations

- The Om detection is heuristic, not a medical, acoustic, or religious authority.
- Sri Chakra geometry is visually recognizable but not a mathematically exact traditional Sri Yantra construction.
- Browser microphone permission behavior differs by platform, especially mobile Safari.
- Audio upload analysis uses browser-side decoding and sampled feature estimation rather than full offline spectrogram analysis.
- No audio is uploaded to a server; all analysis is browser-side.

## Future improvements

- Replace the Sri Chakra approximation with an exact traditional geometric construction module.
- Add WebGL rendering for higher particle counts.
- Add optional pitch tracking with autocorrelation/YIN.
- Add calibration profiles for different voices and microphone environments.
- Add shareable visual presets.
- Add automated browser tests with Playwright.
