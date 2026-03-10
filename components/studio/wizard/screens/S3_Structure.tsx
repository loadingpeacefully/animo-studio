'use client'

import { useState, useEffect } from 'react'
import { generateScenes } from '@/lib/lessonGenerator'
import type { DraftScene } from '@/lib/lessonGenerator'
import type { SubjectArea, GradeLevel, SceneTag } from '@/lib/types'

interface S3Props {
  topic: string
  subject: SubjectArea
  gradeLevel: GradeLevel
  scenes: DraftScene[]
  onScenes: (scenes: DraftScene[]) => void
}

const TAG_COLORS: Record<SceneTag, string> = {
  explain:    '#E8623A',
  think:      '#7C3AED',
  question:   '#3ABDE8',
  surprise:   '#F59E0B',
  celebrate:  '#0D9488',
  transition: '#8A8178',
}

const TAG_LABELS: Record<SceneTag, string> = {
  explain:    'Explaining',
  think:      'Thinking',
  question:   'Asking',
  surprise:   'Surprised',
  celebrate:  'Celebrating',
  transition: 'Moving On',
}

export function S3_Structure({ topic, subject, gradeLevel, scenes, onScenes }: S3Props) {
  const [lessonLength, setLessonLength] = useState<'standard' | 'short'>('standard')

  useEffect(() => {
    const generated = generateScenes({ topic, subject, gradeLevel, lessonLength })
    onScenes(generated)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, subject, gradeLevel, lessonLength])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-20">

      <p className="fade-up-1 text-[11px] font-mono uppercase tracking-widest text-muted mb-8">
        Step 03 · Structure
      </p>

      <h2 className="fade-up-2 font-display text-[44px] font-semibold text-[var(--text)] text-center leading-tight mb-4 max-w-xl">
        Your Golden Lesson Arc
      </h2>
      <p className="fade-up-2 text-[14px] text-muted text-center mb-10 max-w-md">
        Generated from proven patterns across 300+ real lessons. You&apos;ll edit the script in the next step.
      </p>

      {/* Length toggle */}
      <div className="fade-up-3 flex items-center gap-1 p-1 bg-surface border border-edge rounded-xl mb-8">
        {(['standard', 'short'] as const).map(len => (
          <button
            key={len}
            type="button"
            onClick={() => setLessonLength(len)}
            className={`px-5 py-2 rounded-lg text-[12px] font-semibold transition-all ${
              lessonLength === len
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted hover:text-[var(--text)]'
            }`}
          >
            {len === 'standard' ? `Standard · ${scenes.length || 8} scenes` : 'Short · 4 scenes'}
          </button>
        ))}
      </div>

      {/* Arc visualization */}
      <div className="fade-up-3 w-full max-w-[640px] space-y-2">
        {scenes.map((scene, i) => (
          <div
            key={scene.id}
            className={`flex items-start gap-4 p-4 bg-surface rounded-xl border-l-[3px] scene-${scene.tag}`}
            style={{ borderLeftColor: TAG_COLORS[scene.tag] }}
          >
            {/* Order */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-mono font-bold"
              style={{ background: `${TAG_COLORS[scene.tag]}22`, color: TAG_COLORS[scene.tag] }}
            >
              {i + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest font-mono"
                  style={{ color: TAG_COLORS[scene.tag] }}
                >
                  {TAG_LABELS[scene.tag]}
                </span>
              </div>
              <p className="text-[12px] text-muted leading-relaxed">{scene.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Regenerate hint */}
      <p className="fade-up-4 text-[11px] text-muted font-mono mt-6">
        The structure adjusts automatically based on your subject and grade level.
      </p>

    </div>
  )
}
