export function ExplanationPanel() {
  return (
    <section className="glass-panel rounded-3xl p-4 sm:p-5" aria-labelledby="explanation-heading">
      <h2 id="explanation-heading" className="text-lg font-semibold text-white">How it works</h2>
      <div className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
        <p>
          <strong className="text-amber-100">Cymatics Mode</strong> uses microphone-derived amplitude, frequency, spectral centroid, energy bands, and harmonic estimates to drive radial nodal patterns, particles, rings, and wave motion.
        </p>
        <p>
          <strong className="text-amber-100">Sri Chakra Mode</strong> is a calibrated symbolic mode. A stable low-to-mid sustained chant increases an Om stability score, which gradually resolves particles toward a Sri Chakra-inspired geometry.
        </p>
        <p>
          Microphone permission is required only for live browser-side audio analysis. Audio is not sent to a server by this app.
        </p>
        <p className="rounded-2xl border border-amber-200/20 bg-amber-200/8 p-3 text-amber-50">
          Limitation: this is a cymatics-inspired and sacred-geometry visualization, not scientific proof that Om physically creates Sri Chakra.
        </p>
      </div>
    </section>
  );
}
