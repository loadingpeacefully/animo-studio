import Link from 'next/link'
import { MAX_CHARACTER } from '@/lib/lessonStore'

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar() {
  return (
    <header className="h-[52px] bg-bg border-b border-edge flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">✦</span>
          </div>
          <span className="font-display text-[17px] text-[var(--text)] font-semibold">Animo</span>
        </Link>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted border border-edge px-1.5 py-0.5 rounded">Studio</span>
      </div>
      <nav className="flex items-center gap-1">
        <Link href="/lessons" className="px-3 py-1.5 text-[12px] text-muted hover:text-[var(--text)] rounded-md transition-colors">My Lessons</Link>
        <Link href="/studio/new" className="ml-2 px-3.5 py-1.5 bg-accent text-white text-[12px] font-semibold rounded-lg hover:bg-[var(--accent-h)] transition-colors">
          + New Lesson
        </Link>
      </nav>
    </header>
  )
}

// ─── Max character card (active) ─────────────────────────────────────────────

function MaxCard() {
  return (
    <div className="bg-surface rounded-2xl border-2 border-accent overflow-hidden relative">
      {/* Active badge */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-surface border border-edge rounded-full px-2.5 py-1">
        <div className="w-1.5 h-1.5 rounded-full bg-live pulse-dot" />
        <span className="text-[11px] font-medium text-[var(--text)] font-mono">Available</span>
      </div>

      {/* Thumbnail */}
      <div
        className="h-48 flex items-center justify-center relative"
        style={{ background: 'linear-gradient(135deg, #1A2840 0%, #2A3850 100%)' }}
      >
        {/* Character silhouette */}
        <div className="flex flex-col items-center gap-0">
          <div className="w-16 h-16 rounded-full bg-[#F5C5A0] border-4 border-[#E8B090] relative">
            <div className="absolute top-4 left-3 w-2 h-2 rounded-full bg-[#4A3020]" />
            <div className="absolute top-4 right-3 w-2 h-2 rounded-full bg-[#4A3020]" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-[#C06040]" />
          </div>
          <div className="w-12 h-16 rounded-t-xl bg-accent -mt-1" />
        </div>
        <div className="absolute bottom-3 text-[12px] font-semibold text-white/80 font-mono">Max</div>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-[16px] font-semibold text-[var(--text)]">Max</h3>
            <p className="text-[12px] text-muted mt-0.5">Friendly · Cartoon · Child</p>
          </div>
          <span className="text-[10px] font-semibold text-accent bg-[rgba(232,98,58,0.12)] border border-[rgba(232,98,58,0.25)] px-2 py-0.5 rounded-full">
            Default
          </span>
        </div>

        {/* Spine metadata */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Engine',     value: 'Spine 4.1' },
            { label: 'Bones',      value: `${MAX_CHARACTER.bones}` },
            { label: 'Slots',      value: `${MAX_CHARACTER.slots}` },
            { label: 'Animations', value: `${MAX_CHARACTER.animations.length}` },
          ].map(item => (
            <div key={item.label} className="bg-[var(--surface-2)] rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted uppercase tracking-wide font-mono">{item.label}</p>
              <p className="text-[13px] font-semibold text-[var(--text)] mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Moods — teacher labels only, no Spine terminology */}
        <div className="mb-5">
          <p className="text-[10px] text-muted uppercase tracking-widest font-mono mb-2">Moods</p>
          <div className="flex flex-wrap gap-1.5">
            {['Explaining', 'Thinking', 'Asking', 'Celebrating', 'Surprised', 'Moving On'].map(mood => (
              <span
                key={mood}
                className="px-2 py-0.5 bg-[var(--surface-2)] border border-edge rounded-full text-[11px] text-muted"
              >
                {mood}
              </span>
            ))}
          </div>
        </div>

        <Link
          href="/studio/new"
          className="block w-full text-center py-2.5 bg-accent text-white text-[13px] font-semibold rounded-xl hover:bg-[var(--accent-h)] transition-colors"
        >
          Use Max in a lesson
        </Link>
      </div>
    </div>
  )
}

// ─── Locked character slot ────────────────────────────────────────────────────

interface LockedCardProps {
  name: string
  description: string
  tags: string[]
}

function LockedCard({ name, description, tags }: LockedCardProps) {
  return (
    <div className="bg-surface rounded-2xl border border-edge overflow-hidden opacity-60">
      {/* Thumbnail */}
      <div
        className="h-48 flex flex-col items-center justify-center gap-3 relative"
        style={{ background: 'linear-gradient(135deg, #1C1917 0%, #252220 100%)' }}
      >
        <div className="w-14 h-14 rounded-full border-2 border-edge flex items-center justify-center">
          <span className="text-[22px]">🔒</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted bg-[var(--surface-2)] border border-edge px-2 py-0.5 rounded-full font-mono">
            Phase 2
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-[15px] font-semibold text-[var(--text)]">{name}</h3>
          <p className="text-[12px] text-muted mt-0.5 leading-relaxed">{description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-[var(--surface-2)] border border-edge rounded-full text-[11px] text-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="py-2.5 text-center text-[12px] text-muted border border-edge rounded-xl">
          Coming in Phase 2
        </div>
      </div>
    </div>
  )
}

// ─── Locked character definitions ────────────────────────────────────────────

const LOCKED_CHARACTERS: LockedCardProps[] = [
  {
    name: 'Mia',
    description: 'Curious and enthusiastic — perfect for science and discovery lessons.',
    tags: ['Curious', 'Energetic', 'Child'],
  },
  {
    name: 'Leo',
    description: 'Calm and wise — ideal for history, philosophy, and reflection tasks.',
    tags: ['Wise', 'Calm', 'Adult'],
  },
  {
    name: 'Zara',
    description: 'Creative and expressive — built for art, music, and language lessons.',
    tags: ['Creative', 'Expressive', 'Teen'],
  },
  {
    name: 'Ben',
    description: 'Athletic and playful — great for PE, health, and motivational content.',
    tags: ['Playful', 'Athletic', 'Child'],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Topbar />

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-8">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="font-display text-[28px] font-semibold text-[var(--text)]">Character Library</h1>
          <p className="text-[12px] text-muted mt-1 font-mono">1 character available · 4 unlocking in Phase 2</p>
        </div>

        {/* ── Available now ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-live pulse-dot" />
            <h2 className="text-[11px] font-semibold text-[var(--text)] uppercase tracking-widest font-mono">Available Now</h2>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <MaxCard />
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="border-t border-edge mb-8" />

        {/* ── Coming in Phase 2 ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[13px]">🔒</span>
            <h2 className="text-[11px] font-semibold text-muted uppercase tracking-widest font-mono">Coming in Phase 2</h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {LOCKED_CHARACTERS.map(char => (
              <LockedCard key={char.name} {...char} />
            ))}
          </div>
        </div>

        {/* ── Custom character note ─────────────────────────────────────── */}
        <div className="mt-10 p-5 bg-surface rounded-2xl border border-edge flex items-start gap-4">
          <div className="w-9 h-9 rounded-full bg-[var(--surface-2)] border border-edge flex items-center justify-center text-[16px] flex-shrink-0">
            ℹ️
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--text)] mb-1">Adding custom characters</p>
            <p className="text-[13px] text-muted leading-relaxed">
              Phase 2 will support custom Spine 4.1 characters. Export your character as{' '}
              <code className="bg-[var(--surface-2)] border border-edge px-1.5 py-0.5 rounded text-[11px] font-mono">.json + .atlas + .png</code>,
              then upload via the Character Library. Animo Studio automatically maps your animations
              to the six teacher-friendly moods.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
