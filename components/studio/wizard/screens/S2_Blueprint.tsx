'use client'

import { useEffect, useState, useRef } from 'react'
import { useCourseStore } from '@/lib/courseStore'
import type { CourseBrief, CourseBlueprint, ModuleSpec } from '@/lib/courseGenerator/types'

const ACTIVITY_ICONS: Record<string, string> = {
  'activity-mcq':            '❓',
  'activity-fill-blanks':    '✏️',
  'activity-reorder':        '↕️',
  'activity-flip-multi-card':'🃏',
  'activity-table':          '📊',
  'activity-bucketing':      '🗂️',
  'activity-linking':        '🔗',
}

interface S2Props {
  brief: CourseBrief
}

export function S2_Blueprint({ brief }: S2Props) {
  const { blueprint, setBlueprint, updateModuleTitle } = useCourseStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (blueprint || hasFetched.current) return
    hasFetched.current = true
    setLoading(true)
    setError(null)

    fetch('/api/generate/blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief),
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Failed') })
        return res.json()
      })
      .then((data: CourseBlueprint) => {
        setBlueprint(data)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [brief, blueprint, setBlueprint])

  return (
    <div className="flex flex-col items-center justify-center h-full overflow-y-auto px-8 py-20">

      <p className="fade-up-1 text-[11px] font-mono uppercase tracking-widest text-muted mb-8">
        Step 02 · Blueprint
      </p>

      <h2 className="fade-up-2 font-display text-[44px] font-semibold text-[var(--text)] text-center leading-tight mb-2 max-w-xl">
        {loading ? 'Designing your course…' : blueprint ? blueprint.courseTitle : 'Your course blueprint'}
      </h2>

      {blueprint && (
        <p className="fade-up-2 text-[14px] text-muted text-center mb-10 max-w-xl italic">
          {blueprint.premise}
        </p>
      )}

      {error && (
        <div className="mb-8 px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[13px] text-red-400">
          {error}
        </div>
      )}

      <div className="fade-up-3 w-full max-w-[760px]">

        {loading && (
          <div className="grid gap-3">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="h-[72px] bg-surface border border-edge rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {blueprint && (
          <>
            <div className="grid gap-3 mb-8">
              {blueprint.modules.map((mod: ModuleSpec, i: number) => (
                <div
                  key={mod.moduleId}
                  className="flex items-center gap-4 bg-surface border border-edge rounded-2xl px-5 py-4 hover:border-[var(--muted)] transition-colors"
                >
                  {/* Number badge */}
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-edge flex items-center justify-center flex-shrink-0">
                    <span className="text-[12px] font-mono font-bold text-muted">{String(i + 1).padStart(2, '0')}</span>
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    {editingId === mod.moduleId ? (
                      <input
                        autoFocus
                        defaultValue={mod.title}
                        onBlur={e => {
                          updateModuleTitle(mod.moduleId, e.target.value)
                          setEditingId(null)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            updateModuleTitle(mod.moduleId, e.currentTarget.value)
                            setEditingId(null)
                          }
                        }}
                        className="w-full bg-transparent border-b border-accent text-[14px] text-[var(--text)] focus:outline-none pb-0.5"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingId(mod.moduleId)}
                        className="text-[14px] font-medium text-[var(--text)] text-left hover:text-accent transition-colors truncate w-full"
                      >
                        {mod.title}
                      </button>
                    )}
                    <p className="text-[11px] text-muted mt-0.5 truncate">{mod.conceptTaught}</p>
                  </div>

                  {/* Activity chip */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[13px]">{ACTIVITY_ICONS[mod.activityType] ?? '📌'}</span>
                    <span className="text-[10px] font-mono text-muted">{mod.activityType.replace('activity-', '')}</span>
                  </div>

                  {/* Time */}
                  <div className="text-[11px] font-mono text-muted flex-shrink-0">
                    {mod.estimatedMinutes}m
                  </div>
                </div>
              ))}
            </div>

            {/* World setting caption */}
            <div className="text-center border-t border-edge pt-6">
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">World Setting</p>
              <p className="text-[14px] text-muted italic max-w-lg mx-auto">{blueprint.worldSetting}</p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
