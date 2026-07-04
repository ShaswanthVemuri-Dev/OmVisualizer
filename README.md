# Om Cymatics Visualizer

Om Cymatics Visualizer is a production-ready responsive web app that creates cymatics-inspired sacred-geometry visuals from microphone input. It is designed around two complementary modes:

- **Cymatics Mode** — a physics-inspired visualization driven by amplitude, frequency, spectral centroid, energy bands, harmonic richness, and resonance-style nodal patterns.
- **Sri Chakra Mode** — a calibrated symbolic sacred-geometry mode where a clean, stable Om / Aum-like chant progressively resolves the particle field toward a Sri Chakra / Sri Yantra-inspired final geometry.

> Scientific disclaimer: Sri Chakra Mode is a calibrated sacred-geometry interpretation, not laboratory proof that Om physically creates Sri Chakra.

## Features

- Next.js App Router with TypeScript
- Tailwind CSS styling
- Web Audio API microphone analysis
- Canvas 2D particle renderer
- Responsive mobile-first layout
- Live Mode for real-time animated visuals
- Final Render Mode for recording, analysis, and static final output
- Programmatic Sri Chakra-inspired geometry with no external image asset
- Microphone permission error handling
- PNG download from canvas
- Audio analysis panel showing amplitude, dominant frequency, spectral centroid, energy bands, harmonic richness, and Om stability score
- Vercel-ready deployment

## Tech stack

- Next.js
- React functional components
- TypeScript
- Tailwind CSS
- Web Audio API
- Canvas 2D

## Project structure

```txt
app/page.tsx
app/layout.tsx
app/globals.css
components/VisualizerCanvas.tsx
components/Controls.tsx
components/AudioStatsPanel.tsx
components/ExplanationPanel.tsx
lib/audioAnalysis.ts
lib/geometry/sriChakra.ts
lib/geometry/cymatics.ts
lib/types.ts
```

## Local development

```bash
npm install
npm run dev
```

Open the local URL shown by Next.js, usually `http://localhost:3000`.

## Production build

```bash
npm run build
npm start
```

## Vercel deployment

```bash
npm install
npm run build
vercel
```

Microphone access requires a secure context in production. Vercel provides HTTPS automatically, so microphone permission should work after deployment.

## GitHub setup

This repository was initialized and committed locally. If GitHub CLI is authenticated on your machine, run:

```bash
gh repo create om-cymatics-visualizer --public --source=. --remote=origin --push
```

If GitHub CLI is not installed or not authenticated, create a public repository named `om-cymatics-visualizer` on GitHub, then run:

```bash
git remote add origin https://github.com/<your-username>/om-cymatics-visualizer.git
git branch -M main
git push -u origin main
```

## Algorithm notes

`analyzeAudioFrame(frequencyData, timeDomainData, sampleRate)` returns:

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

The Om stability score is approximate and favors:

- sustained amplitude instead of sudden noise
- lower-to-mid dominant frequency ranges
- stable dominant frequency over a rolling buffer
- smooth amplitude envelope
- harmonic richness
- low/mid energy balance over high-frequency noise

In Sri Chakra Mode, this score is used as morph progress:

- `0` = chaotic cymatics-inspired particles
- `1` = resolved Sri Chakra-inspired symbolic geometry

Final Render Mode aggregates recorded audio features and renders a deterministic final visual from the summary.

## Manual test checklist

- [ ] App loads without runtime errors.
- [ ] Layout has no horizontal scrolling on mobile.
- [ ] Canvas stays centered and responsive on iPhone, Android, iPad/tablet, laptop, and desktop widths.
- [ ] Speak button triggers the browser microphone permission prompt.
- [ ] Denying microphone permission shows the correct helpful error and does not crash.
- [ ] Live Mode renders moving visuals reacting to sound.
- [ ] Cymatics Mode does not hardcode Sri Chakra geometry.
- [ ] Sri Chakra Mode remains chaotic for random noise.
- [ ] Sri Chakra Mode converges toward Sri Chakra-inspired geometry for a stable Om-like chant.
- [ ] Final Render Mode records, stops, aggregates features, and holds the final visual.
- [ ] Clear Visual resets the canvas and analysis panel.
- [ ] Download Image exports a PNG.
- [ ] Repeated start/stop cycles do not leave microphone tracks active.
- [ ] `npm run build` completes successfully.

## Known limitations

- The Om detection is heuristic, not medical, phonetic, or laboratory-grade acoustic validation.
- The Sri Chakra geometry is visually recognizable and modular, but it is not a mathematically exact traditional Sri Yantra construction.
- Browser microphone behavior differs across platforms, especially mobile Safari.
- Local development microphone access may be restricted unless served from `localhost` or HTTPS.

## Future improvements

- Add optional audio file upload analysis.
- Add a more exact Sri Yantra construction module.
- Add WebGL renderer for higher particle counts.
- Add automated Playwright tests for UI flows.
- Add calibration presets for different voice ranges.
