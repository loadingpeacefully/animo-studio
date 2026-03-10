'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { MAX_CHARACTER } from '@/lib/characters/max'
import { SCENE_TAG_ANIMATIONS } from '@/lib/animationStates'
import type { SceneTag } from '@/lib/types'

// Dynamic import — SpineCanvas must not SSR
const SpineCanvas = dynamic(
  () => import('@/components/spine/SpineCanvas').then(m => ({ default: m.SpineCanvas })),
  { ssr: false, loading: () => <SpinePlaceholder /> }
)

function SpinePlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#191714] rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full spinner" />
        <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Loading Max…</span>
      </div>
    </div>
  )
}

// ─── Mood chips — teacher labels only, resolved to Spine anim names internally ─

interface Mood {
  label: string   // teacher-facing
  tag: SceneTag   // used only to resolve animationName via SCENE_TAG_ANIMATIONS
}

const MOODS: Mood[] = [
  { label: 'Explaining',  tag: 'explain' },
  { label: 'Thinking',    tag: 'think' },
  { label: 'Asking',      tag: 'question' },
  { label: 'Surprised',   tag: 'surprise' },
  { label: 'Celebrating', tag: 'celebrate' },
  { label: 'Moving On',   tag: 'transition' },
]

const LOCKED_CHARACTERS = [
  { id: 'priya',  name: 'Priya',     desc: 'Curious & enthusiastic', gradient: 'linear-gradient(135deg,#1A3020,#2A4830)' },
  { id: 'msgreen',name: 'Ms. Green', desc: 'Calm & wise',            gradient: 'linear-gradient(135deg,#2A2010,#3A3020)' },
  { id: 'leo',    name: 'Leo',       desc: 'Creative & expressive',  gradient: 'linear-gradient(135deg,#3A1A20,#5A2830)' },
  { id: 'ben',    name: 'Ben',       desc: 'Playful & athletic',     gradient: 'linear-gradient(135deg,#1A2830,#203A40)' },
]

interface S5Props {
  characterId: string
  onCharacter: (id: string) => void
}

export function S5_Character({ characterId, onCharacter }: S5Props) {
  const [activeMood, setActiveMood] = useState<Mood>(MOODS[0])

  // Resolve teacher label → Spine animation name — only here, never in UI labels
  const resolvedAnimName = SCENE_TAG_ANIMATIONS[activeMood.tag]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-20">

      <p className="fade-up-1 text-[11px] font-mono uppercase tracking-widest text-muted mb-8">
        Step 05 · Character
      </p>

      <h2 className="fade-up-2 font-display text-[44px] font-semibold text-[var(--text)] text-center leading-tight mb-4 max-w-xl">
        Who will teach your lesson?
      </h2>
      <p className="fade-up-2 text-[14px] text-muted text-center mb-10 max-w-md">
        One character available now. More arrive in Phase 2.
      </p>

      <div className="fade-up-3 flex items-start gap-6 max-w-[960px] w-full">

        {/* ── Max — live Spine preview ─────────────────────────────────── */}
        <button
          type="button"
          onClick={() => onCharacter('max')}
          className={`w-[320px] flex-shrink-0 rounded-2xl border-2 overflow-hidden text-left transition-all ${
            characterId === 'max'
              ? 'border-accent shadow-[0_0_0_4px_rgba(232,98,58,0.15)]'
              : 'border-edge hover:border-[var(--muted)]'
          }`}
        >
          {/* Live Spine player */}
          <div className="relative" style={{ height: 260, background: '#191714' }}>
            <SpineCanvas
              character={MAX_CHARACTER}
              animationName={resolvedAnimName}
              loop={true}
              backgroundColor="#191714"
              width="100%"
              height={260}
            />

            {/* Selected badge */}
            {characterId === 'max' && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-glow">
                <span className="text-white text-[12px] font-bold">✓</span>
              </div>
            )}
          </div>

          {/* Info + mood chips */}
          <div className="p-5 bg-surface">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[16px] font-semibold text-[var(--text)]">Max</h3>
                <p className="text-[11px] text-muted mt-0.5 font-mono">Friendly · Cartoon · Child</p>
              </div>
              <span className="text-[10px] font-semibold font-mono text-live border border-[rgba(76,175,125,0.3)] bg-[rgba(76,175,125,0.1)] px-2 py-0.5 rounded-full uppercase tracking-wide">
                Available
              </span>
            </div>

            {/* Mood chips — clicking previews that animation on Max */}
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted mb-2">Preview mood</p>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map(mood => (
                  <button
                    key={mood.tag}
                    type="button"
                    onClick={e => { e.stopPropagation(); setActiveMood(mood) }}
                    className={`px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                      activeMood.tag === mood.tag
                        ? 'bg-accent text-white'
                        : 'bg-[var(--surface-2)] border border-edge text-muted hover:border-[var(--muted)]'
                    }`}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </button>

        {/* ── Locked Phase 2 characters ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          {LOCKED_CHARACTERS.map(char => (
            <div
              key={char.id}
              className="rounded-2xl border border-edge overflow-hidden opacity-50 cursor-not-allowed"
            >
              <div
                className="h-32 flex items-center justify-center relative"
                style={{ background: char.gradient }}
              >
                <div className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
                  <span className="text-[18px]">🔒</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-muted bg-[rgba(0,0,0,0.4)] px-2 py-0.5 rounded-full">
                    Phase 2
                  </span>
                </div>
              </div>
              <div className="p-4 bg-surface">
                <p className="text-[13px] font-semibold text-[var(--text)]">{char.name}</p>
                <p className="text-[11px] text-muted mt-0.5">{char.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  )
}
