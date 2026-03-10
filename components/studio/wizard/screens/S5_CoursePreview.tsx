'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCourseStore } from '@/lib/courseStore'
import { TaskRenderer } from '@/components/previewer/TaskRenderer'
import type { GeneratedModule } from '@/lib/courseGenerator/types'

// ─── Template metadata ────────────────────────────────────────────────────────

const TMPL_LABEL: Record<string, string> = {
  'activity-conversation':       'Conversation',
  'readonly':                    'Read',
  'activity-mcq':                'Multiple Choice',
  'activity-fill-blanks':        'Fill Blanks',
  'activity-reorder':            'Reorder',
  'activity-flip-multi-card':    'Flip Cards',
  'activity-table':              'Table',
  'activity-bucketing':          'Sort',
  'activity-linking':            'Match',
  'activity-character-feedback': 'Feedback',
}

const TMPL_COLOR: Record<string, string> = {
  'activity-conversation':       '#D4A017',
  'readonly':                    '#3ABDE8',
  'activity-mcq':                '#E8623A',
  'activity-fill-blanks':        '#7C3AED',
  'activity-reorder':            '#0D9488',
  'activity-flip-multi-card':    '#E85146',
  'activity-table':              '#3ABDE8',
  'activity-bucketing':          '#4CAF7D',
  'activity-linking':            '#D4A017',
  'activity-character-feedback': '#4CAF7D',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onBack:     () => void
  onContinue: () => void
}

export function S5_CoursePreview({ onBack, onContinue }: Props) {
  const router = useRouter()
  const { blueprint, modules } = useCourseStore()
  const [activeModIdx,  setActiveModIdx]  = useState(0)
  const [activeTaskIdx, setActiveTaskIdx] = useState(0)

  const activeMod: GeneratedModule | undefined = modules[activeModIdx]
  const tasks        = activeMod?.tasks ?? []
  const task         = tasks[activeTaskIdx]
  const totalTasks   = modules.reduce((s, m) => s + m.tasks.length, 0)
  const hasAllMods   = blueprint ? modules.length === blueprint.modules.length : false
  const tmplLabel    = task ? (TMPL_LABEL[task.template] ?? task.template) : ''
  const tmplColor    = task ? (TMPL_COLOR[task.template] ?? '#8A8580') : '#8A8580'

  // Task-type distribution for right panel
  const typeDist = useMemo(() => {
    if (totalTasks === 0) return []
    const counts: Record<string, number> = {}
    modules.forEach(m => m.tasks.forEach(t => {
      counts[t.template] = (counts[t.template] || 0) + 1
    }))
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tmpl, count]) => ({
        label: TMPL_LABEL[tmpl] ?? tmpl,
        color: TMPL_COLOR[tmpl] ?? '#8A8580',
        pct:   Math.round((count / totalTasks) * 100),
      }))
  }, [modules, totalTasks])

  if (!blueprint || modules.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted font-mono text-[13px]">No modules generated yet.</p>
      </div>
    )
  }

  function switchMod(i: number) {
    setActiveModIdx(i)
    setActiveTaskIdx(0)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Top strip ──────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 h-[52px] border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted flex-shrink-0">
            Step 05 · Preview
          </span>
          <div className="w-px h-3.5 bg-edge flex-shrink-0" />
          <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>
            {blueprint.courseTitle ?? 'Course Preview'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {hasAllMods && (
            <span
              className="text-[9px] font-mono px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(76,175,125,0.1)',
                color:      'var(--live)',
                border:     '1px solid rgba(76,175,125,0.2)',
              }}
            >
              ✓ All modules ready
            </span>
          )}
          <button
            type="button"
            onClick={() => router.push('/preview')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-muted hover:text-[var(--text)] transition-colors border border-edge hover:border-[var(--muted)]"
            style={{ background: 'var(--surface-2)' }}
          >
            <span className="text-[14px] leading-none">⛶</span>
            Full preview
          </button>
        </div>
      </div>

      {/* ── Three-column body ──────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: module list ──────────────────────────────────────────── */}
        <div
          className="w-44 flex-shrink-0 border-r flex flex-col overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-[8px] font-mono uppercase tracking-widest text-muted px-4 pt-5 pb-2 flex-shrink-0">
            Modules
          </p>
          <div className="flex-1 overflow-y-auto scrollbar-dark pb-4">
            {blueprint.modules.map((spec, i) => {
              const isDone   = i < modules.length
              const isActive = activeModIdx === i && isDone
              const modObj   = modules[i]
              const taskCount = modObj?.tasks?.length ?? 0

              return (
                <button
                  key={spec.moduleId}
                  type="button"
                  disabled={!isDone}
                  onClick={() => { if (isDone) switchMod(i) }}
                  className="w-full text-left px-3 py-2.5 transition-all"
                  style={{
                    borderLeft:  isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    background:  isActive ? 'rgba(232,98,58,0.07)' : 'transparent',
                    opacity:     !isDone ? 0.22 : 1,
                  }}
                >
                  {/* Row: icon + title */}
                  <div className="flex items-start gap-2">
                    <span
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 mt-px text-[8px] font-bold"
                      style={{
                        background: isDone && !isActive
                          ? 'rgba(76,175,125,0.14)'
                          : isActive
                          ? 'rgba(232,98,58,0.2)'
                          : 'var(--surface-2)',
                        color: isDone && !isActive
                          ? 'var(--live)'
                          : isActive
                          ? 'var(--accent)'
                          : 'var(--muted)',
                      }}
                    >
                      {isDone && !isActive ? '✓' : String(i + 1)}
                    </span>
                    <span
                      className="text-[11px] font-medium leading-snug"
                      style={{ color: isActive ? 'var(--text)' : 'var(--muted)' }}
                    >
                      {spec.title}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {isDone && (
                    <div className="mt-1.5 ml-[26px]">
                      <div
                        className="h-[2px] rounded-full overflow-hidden"
                        style={{ background: 'var(--edge)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width:      isActive
                              ? `${((activeTaskIdx + 1) / taskCount) * 100}%`
                              : '100%',
                            background: isActive ? 'var(--accent)' : 'var(--live)',
                          }}
                        />
                      </div>
                      <p className="text-[8px] font-mono mt-0.5" style={{ color: 'var(--edge)' }}>
                        {isActive ? `${activeTaskIdx + 1} / ${taskCount}` : `${taskCount} tasks`}
                      </p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Center: device frame ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 overflow-hidden px-6">

          {/* Context row: template badge + module + task count */}
          <div className="flex items-center gap-2 w-full" style={{ maxWidth: 722 }}>
            {tmplLabel && (
              <span
                className="text-[9px] font-semibold font-mono uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0"
                style={{
                  background: tmplColor + '1A',
                  color:      tmplColor,
                  border:     `1px solid ${tmplColor}35`,
                }}
              >
                {tmplLabel}
              </span>
            )}
            <span className="text-[10px] font-mono text-muted ml-auto truncate max-w-[260px]">
              {activeMod?.title}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--edge)' }}>·</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
              {activeTaskIdx + 1} / {tasks.length}
            </span>
          </div>

          {/* Device frame */}
          {task ? (
            <div
              style={{
                width:        722,
                height:       433,
                position:     'relative',
                flexShrink:   0,
                borderRadius: 20,
                overflow:     'hidden',
                border:       '1.5px solid rgba(255,255,255,0.09)',
                boxShadow:    '0 0 0 1px rgba(0,0,0,0.6), 0 0 60px rgba(232,98,58,0.06), 0 28px 64px rgba(0,0,0,0.7)',
              }}
            >
              {/* Subtle screen glare */}
              <div
                style={{
                  position:      'absolute',
                  inset:         0,
                  zIndex:        10,
                  background:    'linear-gradient(155deg, rgba(255,255,255,0.035) 0%, transparent 38%)',
                  pointerEvents: 'none',
                  borderRadius:  20,
                }}
              />
              {/* Inner canvas — scaled from 800×480 → 722×433 */}
              <div
                style={{
                  width:           800,
                  height:          480,
                  transform:       'scale(0.9025)',
                  transformOrigin: 'top left',
                  background:      '#F5F0E8',
                }}
              >
                <TaskRenderer key={`${task.moduleId}-${task.rank}`} task={task} />
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-center"
              style={{
                width:        722,
                height:       433,
                background:   'var(--surface)',
                borderRadius: 20,
                border:       '1.5px solid var(--edge)',
              }}
            >
              <p className="text-muted text-[12px] font-mono">Module not generated yet.</p>
            </div>
          )}
        </div>

        {/* ── Right: stats panel ─────────────────────────────────────────── */}
        <div
          className="w-[152px] flex-shrink-0 border-l flex flex-col overflow-y-auto scrollbar-dark py-5 px-3.5 gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Big stats */}
          <div>
            <p className="text-[8px] font-mono uppercase tracking-widest text-muted mb-2">Stats</p>
            <div className="flex flex-col gap-2">
              <div
                className="p-2.5 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--edge)' }}
              >
                <p className="text-[8px] font-mono text-muted mb-0.5">Tasks</p>
                <p className="text-[30px] font-bold leading-none" style={{ color: 'var(--text)' }}>
                  {totalTasks}
                </p>
              </div>

              <div
                className="p-2.5 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--edge)' }}
              >
                <p className="text-[8px] font-mono text-muted mb-0.5">Modules</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-[30px] font-bold leading-none" style={{ color: 'var(--text)' }}>
                    {modules.length}
                  </p>
                  <p className="text-[11px] text-muted">/{blueprint.modules.length}</p>
                </div>
                <div
                  className="mt-2 h-[3px] rounded-full overflow-hidden"
                  style={{ background: 'var(--edge)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width:      `${(modules.length / blueprint.modules.length) * 100}%`,
                      background: hasAllMods ? 'var(--live)' : 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Export status */}
          <div
            className="p-2.5 rounded-xl"
            style={{
              background:  hasAllMods ? 'rgba(76,175,125,0.08)' : 'var(--surface-2)',
              border:      `1px solid ${hasAllMods ? 'rgba(76,175,125,0.28)' : 'var(--edge)'}`,
            }}
          >
            <p className="text-[8px] font-mono text-muted mb-1">Export</p>
            <p
              className="text-[12px] font-semibold"
              style={{ color: hasAllMods ? 'var(--live)' : 'var(--muted)' }}
            >
              {hasAllMods ? '✓ Ready' : 'Pending…'}
            </p>
          </div>

          {/* Task type breakdown */}
          {typeDist.length > 0 && (
            <div>
              <p className="text-[8px] font-mono uppercase tracking-widest text-muted mb-2">Types</p>
              <div className="flex flex-col gap-2.5">
                {typeDist.map(({ label, color, pct }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono truncate" style={{ color: 'var(--muted)' }}>
                        {label}
                      </span>
                      <span className="text-[9px] font-mono ml-1 flex-shrink-0" style={{ color: 'var(--edge)' }}>
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="h-[3px] rounded-full overflow-hidden"
                      style={{ background: 'var(--edge)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom nav — in-flow, never overlaps ───────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-center py-3 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'var(--surface)' }}
      >
        <div
          className="flex items-center gap-1 rounded-2xl px-2 py-1.5 border"
          style={{
            background:   'var(--surface-2)',
            borderColor:  'var(--edge)',
            boxShadow:    '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {/* Back */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] text-muted hover:text-[var(--text)] rounded-xl transition-colors"
          >
            ← Back
          </button>

          <div className="w-px h-5 bg-edge" />

          {/* Task prev */}
          <button
            type="button"
            onClick={() => activeTaskIdx > 0 && setActiveTaskIdx(t => t - 1)}
            disabled={activeTaskIdx === 0}
            className="px-3 py-1.5 text-[13px] text-muted hover:text-[var(--text)] disabled:opacity-25 rounded-xl transition-colors"
          >
            ‹
          </button>

          {/* Dot track */}
          <div className="flex items-center gap-1 px-1">
            {tasks.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTaskIdx(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width:      i === activeTaskIdx ? 18 : 5,
                  height:     5,
                  background: i === activeTaskIdx
                    ? 'var(--accent)'
                    : i < activeTaskIdx
                    ? 'rgba(76,175,125,0.55)'
                    : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>

          <span className="text-[10px] font-mono px-1" style={{ color: 'var(--muted)' }}>
            {activeTaskIdx + 1}/{tasks.length}
          </span>

          {/* Task next */}
          <button
            type="button"
            onClick={() => activeTaskIdx < tasks.length - 1 && setActiveTaskIdx(t => t + 1)}
            disabled={activeTaskIdx === tasks.length - 1}
            className="px-3 py-1.5 text-[13px] text-muted hover:text-[var(--text)] disabled:opacity-25 rounded-xl transition-colors"
          >
            ›
          </button>

          <div className="w-px h-5 bg-edge" />

          {/* Export CTA */}
          <button
            type="button"
            onClick={onContinue}
            className="flex items-center gap-1.5 px-5 py-1.5 bg-accent text-white text-[12px] font-semibold rounded-xl hover:bg-[var(--accent-h)] transition-colors"
          >
            Export →
          </button>
        </div>
      </div>

    </div>
  )
}
