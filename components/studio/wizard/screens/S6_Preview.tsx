'use client'

import { useMemo } from 'react'
import { validateScenes } from '@/lib/lessonGenerator'
import type { DraftScene, LessonDraft } from '@/lib/lessonGenerator'
import type { SceneTag } from '@/lib/types'

interface S6Props {
  draft: LessonDraft
  onSave: () => void
  saving: boolean
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

const SUBJECT_LABEL: Record<string, string> = {
  math: 'Math', science: 'Science', english: 'English',
  history: 'History', geography: 'Geography', art: 'Art', other: 'Other',
}
const GRADE_LABEL: Record<string, string> = {
  'K-2': 'Grades K–2', '3-5': 'Grades 3–5', '6-8': 'Grades 6–8',
  '9-12': 'Grades 9–12', 'higher-ed': 'Higher Ed', adult: 'Adult',
}

export function S6_Preview({ draft, onSave, saving }: S6Props) {
  const issues = useMemo(() => validateScenes(draft.scenes), [draft.scenes])
  const errors   = issues.filter(i => i.severity === 'error'   && !i.passed)
  const warnings = issues.filter(i => i.severity === 'warning' && !i.passed)
  const passed   = issues.filter(i => i.passed)

  const canSave = errors.length === 0

  return (
    <div className="flex min-h-screen">

      {/* ── Left: quality check ──────────────────────────────────────────── */}
      <div className="w-[300px] flex-shrink-0 bg-[#191714] border-r border-edge flex flex-col">
        <div className="px-6 py-5 border-b border-edge">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Step 06 · Preview</p>
          <p className="text-[13px] font-semibold text-[var(--text)] mt-1">Quality Check</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2 scrollbar-dark">
          {issues.map(issue => (
            <div
              key={issue.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                issue.passed
                  ? 'border-[rgba(13,148,136,0.2)] bg-[rgba(13,148,136,0.06)]'
                  : issue.severity === 'error'
                  ? 'border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)]'
                  : 'border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.06)]'
              }`}
            >
              <span className="text-[14px] flex-shrink-0 mt-0.5">
                {issue.passed ? '✅' : issue.severity === 'error' ? '❌' : '⚠️'}
              </span>
              <div>
                <p className="text-[10px] font-mono text-muted uppercase tracking-wide">{issue.id}</p>
                <p className="text-[12px] text-[var(--text)] mt-0.5 leading-snug">{issue.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="p-5 border-t border-edge">
          {errors.length > 0 && (
            <p className="text-[11px] text-red-400 font-mono mb-3">
              Fix {errors.length} error{errors.length > 1 ? 's' : ''} before saving.
            </p>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || saving}
            className="w-full py-3 bg-accent text-white text-[13px] font-semibold rounded-xl hover:bg-[var(--accent-h)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save Lesson →'}
          </button>
          <p className="text-[10px] text-muted font-mono text-center mt-2">Saves as Draft · you can edit anytime</p>
        </div>
      </div>

      {/* ── Right: lesson summary ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-12 px-12">

        {/* Title + meta */}
        <div className="mb-8">
          <h1 className="font-display text-[36px] font-semibold text-[var(--text)] leading-tight mb-2">
            {draft.title}
          </h1>
          <div className="flex items-center gap-3 text-[12px] font-mono text-muted">
            <span>{SUBJECT_LABEL[draft.subject] ?? draft.subject}</span>
            <span className="text-edge">·</span>
            <span>{GRADE_LABEL[draft.gradeLevel] ?? draft.gradeLevel}</span>
            <span className="text-edge">·</span>
            <span>{draft.scenes.length} scenes</span>
            <span className="text-edge">·</span>
            <span>Character: Max</span>
          </div>
        </div>

        {/* Scene list */}
        <div className="space-y-3">
          {draft.scenes.map((scene: DraftScene, i: number) => (
            <div
              key={scene.id}
              className="bg-surface rounded-xl p-5 border-l-[3px]"
              style={{ borderLeftColor: TAG_COLORS[scene.tag] }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-semibold font-mono uppercase tracking-widest"
                  style={{ color: TAG_COLORS[scene.tag] }}
                >
                  {String(i + 1).padStart(2, '0')} · {TAG_LABELS[scene.tag]}
                </span>
              </div>
              <p className="text-[11px] text-muted mb-2 leading-snug">{scene.description}</p>
              <p className="text-[13px] text-[var(--text)] leading-relaxed line-clamp-3">{scene.script}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
