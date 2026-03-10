'use client'

import Link from 'next/link'
import type { Lesson } from '@/lib/types'
import { StatusBadge } from '@/components/ui/Badge'
import { resolveSubjectLabel, resolveGradeLabel, formatDuration } from '@/lib/lessonStore'

// ─── Subject emoji + gradient map ─────────────────────────────────────────────

const SUBJECT_EMOJI: Record<string, string> = {
  math: '🔢', science: '🔬', english: '📖',
  history: '🏛️', geography: '🌍', art: '🎨', other: '💡',
}

const SUBJECT_GRADIENT: Record<string, string> = {
  math:      'linear-gradient(135deg, #1A2840, #2A3850)',
  science:   'linear-gradient(135deg, #1A3020, #2A4830)',
  english:   'linear-gradient(135deg, #2A1A40, #3A2850)',
  history:   'linear-gradient(135deg, #3A2010, #4A3020)',
  geography: 'linear-gradient(135deg, #1A2830, #203A40)',
  art:       'linear-gradient(135deg, #3A1A20, #5A2830)',
  other:     'linear-gradient(135deg, #1A2840, #2A3850)',
}

// ─── Lesson card ──────────────────────────────────────────────────────────────

interface LessonCardProps {
  lesson: Lesson
  onDelete?: (id: string) => void
}

export function LessonCard({ lesson, onDelete }: LessonCardProps) {
  const emoji = SUBJECT_EMOJI[lesson.subject] ?? '📚'
  const gradient = SUBJECT_GRADIENT[lesson.subject] ?? SUBJECT_GRADIENT.other
  const duration = formatDuration(lesson.estimatedDuration)
  const sceneCount = lesson.scenes.length

  return (
    <div className="bg-surface rounded-2xl border border-edge overflow-hidden hover:border-[var(--muted)] transition-all duration-200 group hover:-translate-y-0.5">

      {/* ── Thumbnail ───────────────────────────────────────────────────── */}
      <Link href={`/studio/${lesson.id}`} className="block">
        <div
          className="relative h-40 flex items-center justify-center"
          style={{ background: gradient }}
        >
          <span className="text-5xl select-none">{emoji}</span>
          <div className="absolute top-3 right-3">
            <StatusBadge status={lesson.status} />
          </div>
        </div>
      </Link>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <Link href={`/studio/${lesson.id}`}>
          <h3 className="text-[14px] font-semibold text-[var(--text)] leading-snug group-hover:text-accent transition-colors line-clamp-2">
            {lesson.title}
          </h3>
        </Link>
        <p className="text-[11px] text-muted mt-1 font-mono">
          {resolveSubjectLabel(lesson.subject)} · {resolveGradeLabel(lesson.gradeLevel)}
        </p>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="px-4 pb-3 flex items-center justify-between border-t border-edge pt-2.5">
        <div className="flex items-center gap-2 text-[11px] text-muted font-mono">
          <span>{sceneCount} scene{sceneCount !== 1 ? 's' : ''}</span>
          {lesson.estimatedDuration > 0 && (
            <>
              <span className="text-edge">·</span>
              <span>{duration}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/studio/${lesson.id}`}
            className="px-2.5 py-1 text-[11px] font-medium text-muted bg-[var(--surface-2)] rounded-md hover:text-accent transition-colors"
          >
            Edit
          </Link>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(lesson.id)}
              className="px-2.5 py-1 text-[11px] font-medium text-muted hover:text-red-400 rounded-md transition-colors"
              title="Delete lesson"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function LessonCardEmpty() {
  return (
    <div className="bg-surface rounded-2xl border border-dashed border-edge flex flex-col items-center justify-center h-64 gap-3 hover:border-accent transition-colors group cursor-pointer">
      <div className="w-11 h-11 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-xl group-hover:bg-[rgba(232,98,58,0.12)] transition-colors text-muted group-hover:text-accent">
        ✦
      </div>
      <div className="text-center">
        <p className="text-[13px] font-semibold text-[var(--text)]">New Lesson</p>
        <p className="text-[11px] text-muted mt-0.5">Start from scratch or use the Golden Arc</p>
      </div>
    </div>
  )
}
