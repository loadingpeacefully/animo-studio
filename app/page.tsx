import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-8 border-b border-edge">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[14px] font-bold leading-none">✦</span>
          </div>
          <span className="font-display text-[20px] text-[var(--text)] font-semibold">Animo</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted border border-edge px-1.5 py-0.5 rounded">
            Studio
          </span>
        </div>
        <nav className="flex items-center gap-1">
          <Link href="/lessons" className="px-3 py-1.5 text-[13px] text-muted hover:text-[var(--text)] rounded-md transition-colors">
            My Lessons
          </Link>
          <Link href="/library" className="px-3 py-1.5 text-[13px] text-muted hover:text-[var(--text)] rounded-md transition-colors">
            Characters
          </Link>
          <Link
            href="/studio/new"
            className="ml-3 px-4 py-2 bg-accent text-white text-[13px] font-semibold rounded-lg hover:bg-[var(--accent-h)] transition-all hover:-translate-y-px"
          >
            Start Creating →
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">

        <div className="fade-up-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-edge text-[12px] text-muted font-mono uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-live pulse-dot" />
          Phase 1 · Teacher Preview
        </div>

        <h1 className="fade-up-2 font-display text-[64px] lg:text-[80px] font-semibold text-[var(--text)] leading-[1.05] mb-6 max-w-3xl">
          Animate your lessons.{' '}
          <em className="italic text-accent not-italic" style={{ fontStyle: 'italic' }}>Teach the world.</em>
        </h1>

        <p className="fade-up-3 text-[18px] text-muted leading-relaxed mb-10 max-w-lg">
          Create 2D animated educational content in minutes.
          Teacher-led. Reviewer-approved. Export-ready.
        </p>

        <div className="fade-up-4 flex items-center gap-4">
          <Link
            href="/studio/new"
            className="btn-shimmer px-8 py-4 text-white text-[15px] font-semibold rounded-xl shadow-glow transition-all hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(232,98,58,0.4)]"
          >
            Start Creating →
          </Link>
          <Link
            href="/lessons"
            className="px-8 py-4 bg-surface text-[var(--text)] text-[15px] font-medium rounded-xl border border-edge hover:border-[var(--muted)] transition-colors"
          >
            My Lessons
          </Link>
        </div>

        {/* ── Feature trio ──────────────────────────────────────────────── */}
        <div className="fade-up-5 grid grid-cols-3 gap-5 mt-20 max-w-3xl w-full">
          {[
            { icon: '💬', label: 'Character-led', desc: 'Max animates your script. Six moods — Explaining, Thinking, Asking, Surprised, Celebrating, Moving On.' },
            { icon: '✦',  label: 'Golden Arc',    desc: 'Hook → Explore → Interact → Reflect → Reinforce → Close. Proven pattern from 300+ real lessons.' },
            { icon: '📦', label: 'CMS-ready JSON',desc: 'One-click export to strict BrightChamps schema. Importable with zero edits.' },
          ].map(f => (
            <div key={f.label} className="bg-surface rounded-16 border border-edge p-5 text-left hover-lift">
              <div className="text-2xl mb-3">{f.icon}</div>
              <p className="text-[14px] font-semibold text-[var(--text)] mb-1.5">{f.label}</p>
              <p className="text-[12px] text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
