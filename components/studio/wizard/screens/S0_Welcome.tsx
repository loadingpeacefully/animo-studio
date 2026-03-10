'use client'

interface S0Props {
  onStart: () => void
}

export function S0_Welcome({ onStart }: S0Props) {
  return (
    <div className="h-full bg-bg flex flex-col items-center justify-center px-8 text-center">

      {/* Badge */}
      <div className="fade-up-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-edge text-[11px] text-muted font-mono uppercase tracking-widest mb-10">
        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
        New Lesson · 7-step wizard
      </div>

      {/* Headline */}
      <h1 className="fade-up-2 font-display text-[64px] font-semibold text-[var(--text)] leading-[1.05] mb-6 max-w-2xl">
        Let&apos;s build your{' '}
        <em className="text-accent" style={{ fontStyle: 'italic' }}>lesson.</em>
      </h1>

      {/* Subtitle */}
      <p className="fade-up-3 text-[17px] text-muted leading-relaxed mb-12 max-w-md">
        Answer six quick questions. Animo assembles your Golden Lesson Arc — ready to edit, record, and export.
      </p>

      {/* CTA */}
      <div className="fade-up-4">
        <button
          type="button"
          onClick={onStart}
          className="btn-shimmer px-10 py-4 text-white text-[15px] font-semibold rounded-xl shadow-glow transition-all hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(232,98,58,0.4)]"
        >
          Start building →
        </button>
      </div>

      {/* Step preview */}
      <div className="fade-up-5 flex items-center gap-3 mt-14">
        {['Topic', 'Details', 'Structure', 'Script', 'Character', 'Preview'].map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full border border-edge flex items-center justify-center">
                <span className="text-[9px] font-mono text-muted">{i + 1}</span>
              </div>
              <span className="text-[11px] font-mono text-muted uppercase tracking-wide">{label}</span>
            </div>
            {i < 5 && <span className="text-edge text-[11px]">›</span>}
          </div>
        ))}
      </div>

    </div>
  )
}
