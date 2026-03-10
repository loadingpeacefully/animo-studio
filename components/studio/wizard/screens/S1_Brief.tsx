'use client'

import { useCourseStore } from '@/lib/courseStore'
import type { CourseBrief } from '@/lib/courseGenerator/types'

const GRADES = ['K-2', '3-5', '6-8', '9-12'] as const
const TONES: { value: CourseBrief['tone']; label: string; icon: string; desc: string }[] = [
  { value: 'fun',         label: 'Fun',         icon: '🎮', desc: 'Humor, pop culture, emojis' },
  { value: 'adventurous', label: 'Adventurous',  icon: '🚀', desc: 'Stakes, discoveries, missions' },
  { value: 'serious',     label: 'Serious',      icon: '📚', desc: 'Professional, real-world' },
  { value: 'calm',        label: 'Calm',         icon: '🌿', desc: 'Patient, step-by-step' },
]
const ROLES: { value: CourseBrief['characterRole']; label: string; desc: string }[] = [
  { value: 'guide',  label: 'Guide',  desc: 'Explains and leads the student through each concept' },
  { value: 'peer',   label: 'Peer',   desc: 'Learns alongside the student, figures it out together' },
  { value: 'mentor', label: 'Mentor', desc: 'Challenges and provokes deeper thinking' },
]
const MODULE_COUNTS: CourseBrief['moduleCount'][] = [5, 7, 8, 10]

interface S1Props {
  brief: Partial<CourseBrief>
  onChange: (brief: Partial<CourseBrief>) => void
}

export function S1_Brief({ brief, onChange }: S1Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full overflow-y-auto px-8 py-20">

      <p className="fade-up-1 text-[11px] font-mono uppercase tracking-widest text-muted mb-8">
        Step 01 · Brief
      </p>

      <h2 className="fade-up-2 font-display text-[44px] font-semibold text-[var(--text)] text-center leading-tight mb-2 max-w-xl">
        What should students learn?
      </h2>
      <p className="fade-up-2 text-[14px] text-muted text-center mb-10 max-w-md">
        Fill in the brief and we&apos;ll generate a complete 7–8 module course.
      </p>

      <div className="fade-up-3 w-full max-w-[700px] flex flex-col gap-8">

        {/* Topic */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
            Topic
          </label>
          <input
            type="text"
            value={brief.topic ?? ''}
            onChange={e => onChange({ ...brief, topic: e.target.value })}
            placeholder="e.g. How the Internet Works"
            className="w-full bg-surface border border-edge rounded-xl px-4 py-3 text-[15px] text-[var(--text)] placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Grade */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
            Grade Range
          </label>
          <div className="flex gap-2">
            {GRADES.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ ...brief, gradeRange: g })}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                  brief.gradeRange === g
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-edge text-muted hover:border-[var(--muted)]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
            Tone
          </label>
          <div className="grid grid-cols-4 gap-3">
            {TONES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ ...brief, tone: t.value })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  brief.tone === t.value
                    ? 'bg-[rgba(232,98,58,0.08)] border-accent'
                    : 'bg-surface border-edge hover:border-[var(--muted)]'
                }`}
              >
                <div className="text-[22px] mb-2">{t.icon}</div>
                <div className={`text-[13px] font-semibold mb-0.5 ${brief.tone === t.value ? 'text-accent' : 'text-[var(--text)]'}`}>
                  {t.label}
                </div>
                <div className="text-[11px] text-muted">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Character Role */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
            Character Role
          </label>
          <div className="grid grid-cols-3 gap-3">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => onChange({ ...brief, characterRole: r.value })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  brief.characterRole === r.value
                    ? 'bg-[rgba(232,98,58,0.08)] border-accent'
                    : 'bg-surface border-edge hover:border-[var(--muted)]'
                }`}
              >
                <div className={`text-[14px] font-semibold mb-1 ${brief.characterRole === r.value ? 'text-accent' : 'text-[var(--text)]'}`}>
                  {r.label}
                </div>
                <div className="text-[11px] text-muted">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Module Count */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
            Number of Modules
          </label>
          <div className="flex gap-2">
            {MODULE_COUNTS.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ ...brief, moduleCount: n })}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                  brief.moduleCount === n
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-edge text-muted hover:border-[var(--muted)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
