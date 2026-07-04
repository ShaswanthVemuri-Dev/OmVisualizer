export function ExplanationPanel() {
  return (
    <section className="glass-panel rounded-3xl p-4 sm:p-5" aria-labelledby="explanation-heading">
      <h2 id="explanation-heading" className="text-lg font-semibold text-white">How it works</h2>
      <div className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
        <p>
          <strong className="text-amber-100">Cymatics Mode</strong> turns live microphone features into radial waves, nodal rings, harmonic spokes, particle pressure, and resonance-style motion.
        </p>
        <p>
          <strong className="text-amber-100">Sri Chakra Mode</strong> tracks sustained Om-like chanting and uses stability, pitch, envelope, and harmonic richness to resolve the field into Sri Chakra-inspired geometry.
        </p>
        <p>
          Audio stays in the browser. The canvas reacts instantly to your voice and keeps the final render available for download.
        </p>
      </div>
    </section>
  );
}
