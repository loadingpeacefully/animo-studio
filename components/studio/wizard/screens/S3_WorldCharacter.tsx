'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useCourseStore } from '@/lib/courseStore'
import { MAX_CHARACTER } from '@/lib/characters/max'
import type { CourseBrief, CourseBlueprint, CourseCharacterPackage } from '@/lib/courseGenerator/types'

const SpineCanvas = dynamic(
  () => import('@/components/spine/SpineCanvas').then(m => ({ default: m.SpineCanvas })),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#191714] rounded-xl">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full spinner" />
    </div>
  )}
)

// left_loop — resolved via internal Spine name (not shown in UI)
const ACTIVE_ANIM = 'left_loop'

interface S3Props {
  brief: CourseBrief
  blueprint: CourseBlueprint
}

export function S3_WorldCharacter({ brief, blueprint }: S3Props) {
  const { characterPackage, setCharacterPackage } = useCourseStore()
  const hasFetched = useRef(false)

  useEffect(() => {
    if (characterPackage || hasFetched.current) return
    hasFetched.current = true

    fetch('/api/generate/character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, blueprint }),
    })
      .then(res => res.json())
      .then((data: CourseCharacterPackage) => setCharacterPackage(data))
      .catch(console.error)
  }, [brief, blueprint, characterPackage, setCharacterPackage])

  const char = characterPackage?.character
  const world = characterPackage?.world
  const narrative = characterPackage?.narrative

  return (
    <div className="flex flex-col items-center justify-center h-full overflow-y-auto px-8 py-20">

      <p className="fade-up-1 text-[11px] font-mono uppercase tracking-widest text-muted mb-8">
        Step 03 · Character &amp; World
      </p>

      <h2 className="fade-up-2 font-display text-[44px] font-semibold text-[var(--text)] text-center leading-tight mb-10 max-w-xl">
        {char ? `Meet ${char.name}` : 'Creating your character…'}
      </h2>

      <div className="fade-up-3 flex items-start gap-8 max-w-[880px] w-full">

        {/* Left: SpineCanvas + character info (40%) */}
        <div className="w-[340px] flex-shrink-0">
          <div className="rounded-2xl overflow-hidden border border-edge">
            <div style={{ height: 280, background: '#191714', position: 'relative' }}>
              <SpineCanvas
                character={MAX_CHARACTER}
                animationName={ACTIVE_ANIM}
                loop={true}
                backgroundColor="#191714"
                width="100%"
                height={280}
              />
            </div>
            <div className="p-5 bg-surface">
              {char ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[18px] font-semibold text-[var(--text)]">{char.name}</h3>
                    <span
                      className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full border"
                      style={{ color: char.color, borderColor: char.color + '40', backgroundColor: char.color + '15' }}
                    >
                      {char.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {char.personality.split(',').map((adj: string) => (
                      <span
                        key={adj}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-edge text-muted"
                      >
                        {adj.trim()}
                      </span>
                    ))}
                  </div>
                  <p className="text-[13px] text-muted italic">&quot;{char.catchphrase}&quot;</p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 bg-[var(--surface-2)] rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-[var(--surface-2)] rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-[var(--surface-2)] rounded animate-pulse w-3/4" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: World info (60%) */}
        <div className="flex-1 flex flex-col gap-5">
          {world ? (
            <>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">World</p>
                <h3 className="font-display text-[32px] font-semibold text-[var(--text)] leading-tight">
                  {world.name}
                </h3>
              </div>

              <div className="p-4 bg-surface border border-edge rounded-xl">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5">Atmosphere</p>
                <p className="text-[14px] text-[var(--text)]">{world.backgroundTheme}</p>
              </div>

              <div className="p-4 bg-surface border border-edge rounded-xl">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5">Recurring Element</p>
                <p className="text-[14px] text-[var(--text)]">{world.recurringElement}</p>
              </div>

              <div className="p-4 bg-[rgba(232,98,58,0.06)] border border-[rgba(232,98,58,0.2)] rounded-xl">
                <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-1.5">Scene 1 Opens</p>
                <p className="text-[13px] text-[var(--text)] italic">{world.openingScene}</p>
              </div>

              {narrative && (
                <div className="p-4 bg-surface border border-edge rounded-xl">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5">Hook Line</p>
                  <p className="text-[14px] text-[var(--text)] font-medium">&quot;{narrative.hook}&quot;</p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-16 bg-surface border border-edge rounded-xl animate-pulse" />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
