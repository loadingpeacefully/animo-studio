'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLessonStore } from '@/lib/lessonStore'
import { LessonCard, LessonCardEmpty } from '@/components/lessons/LessonCard'
import type { LessonStatus } from '@/lib/types'

const FILTERS: { label: string; value: LessonStatus | 'all' }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Draft',     value: 'draft' },
  { label: 'In Review', value: 'review' },
  { label: 'Approved',  value: 'approved' },
  { label: 'Published', value: 'published' },
]

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
        <Link href="/library" className="px-3 py-1.5 text-[12px] text-muted hover:text-[var(--text)] rounded-md transition-colors">Characters</Link>
        <Link href="/studio/new" className="ml-2 px-3.5 py-1.5 bg-accent text-white text-[12px] font-semibold rounded-lg hover:bg-[var(--accent-h)] transition-colors">
          + New Lesson
        </Link>
      </nav>
    </header>
  )
}

export default function LessonsPage() {
  const { lessons, deleteLesson } = useLessonStore()
  const [filter, setFilter] = useState<LessonStatus | 'all'>('all')

  const filtered = filter === 'all' ? lessons : lessons.filter(l => l.status === filter)
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: lessons.length }
    for (const l of lessons) c[l.status] = (c[l.status] ?? 0) + 1
    return c
  }, [lessons])

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Topbar />
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="font-display text-[28px] font-semibold text-[var(--text)]">My Lessons</h1>
            <p className="text-[12px] text-muted mt-1 font-mono">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/studio/new" className="px-5 py-2.5 bg-accent text-white text-[13px] font-semibold rounded-xl hover:bg-[var(--accent-h)] transition-all hover:-translate-y-px shadow-glow">
            + New Lesson
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-0.5 mb-6 border-b border-edge">
          {FILTERS.map(opt => (
            <button key={opt.value} type="button" onClick={() => setFilter(opt.value)}
              className={`px-3.5 py-2 text-[12px] font-medium rounded-t transition-colors -mb-px ${
                filter === opt.value
                  ? 'text-accent border-b-2 border-accent bg-[rgba(232,98,58,0.08)]'
                  : 'text-muted hover:text-[var(--text)]'
              }`}
            >
              {opt.label}
              {(counts[opt.value] ?? 0) > 0 && (
                <span className={`ml-1.5 text-[10px] font-mono px-1 py-0.5 rounded-full ${
                  filter === opt.value ? 'bg-accent text-white' : 'bg-surface text-muted'
                }`}>{counts[opt.value]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-3 gap-5">
            {filtered.map(l => <LessonCard key={l.id} lesson={l} onDelete={deleteLesson} />)}
            <Link href="/studio/new"><LessonCardEmpty /></Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-edge flex items-center justify-center text-3xl mb-5">📚</div>
            <h3 className="font-display text-[20px] font-semibold text-[var(--text)] mb-2">
              No {filter === 'all' ? '' : filter + ' '}lessons yet
            </h3>
            <p className="text-[13px] text-muted mb-7">
              {filter === 'all' ? 'Create your first lesson to get started.' : `No lessons with status "${filter}" found.`}
            </p>
            {filter === 'all' && (
              <Link href="/studio/new" className="px-6 py-3 bg-accent text-white text-[14px] font-semibold rounded-xl hover:bg-[var(--accent-h)] transition-colors">
                Create your first lesson
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
