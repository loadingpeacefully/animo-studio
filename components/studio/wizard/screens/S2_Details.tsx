'use client'

import type { SubjectArea, GradeLevel } from '@/lib/types'

interface S2Props {
  subject: SubjectArea
  gradeLevel: GradeLevel
  language: string
  onSubject: (v: SubjectArea) => void
  onGrade: (v: GradeLevel) => void
  onLanguage: (v: string) => void
}

const SUBJECTS: { value: SubjectArea; label: string; emoji: string; desc: string }[] = [
  { value: 'math',      label: 'Math',      emoji: '🔢', desc: 'Numbers, algebra, geometry' },
  { value: 'science',   label: 'Science',   emoji: '🔬', desc: 'Biology, chemistry, physics' },
  { value: 'english',   label: 'English',   emoji: '📖', desc: 'Reading, writing, grammar' },
  { value: 'history',   label: 'History',   emoji: '🏛️', desc: 'Events, people, timelines' },
  { value: 'geography', label: 'Geography', emoji: '🌍', desc: 'Maps, places, environments' },
  { value: 'art',       label: 'Art',       emoji: '🎨', desc: 'Creativity, culture, expression' },
  { value: 'other',     label: 'Other',     emoji: '💡', desc: 'Any other subject area' },
]

const GRADES: { value: GradeLevel; label: string; range: string }[] = [
  { value: 'K-2',       label: 'K–2',           range: 'Ages 5–8' },
  { value: '3-5',       label: 'Grades 3–5',    range: 'Ages 8–11' },
  { value: '6-8',       label: 'Grades 6–8',    range: 'Ages 11–14' },
  { value: '9-12',      label: 'Grades 9–12',   range: 'Ages 14–18' },
  { value: 'higher-ed', label: 'Higher Ed',     range: 'University' },
  { value: 'adult',     label: 'Adult',         range: 'Professional' },
]

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
]

export function S2_Details({ subject, gradeLevel, language, onSubject, onGrade, onLanguage }: S2Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-20">

      <p className="fade-up-1 text-[11px] font-mono uppercase tracking-widest text-muted mb-8">
        Step 02 · Details
      </p>

      <h2 className="fade-up-2 font-display text-[44px] font-semibold text-[var(--text)] text-center leading-tight mb-12 max-w-xl">
        Who are you teaching?
      </h2>

      <div className="fade-up-3 w-full max-w-[720px] space-y-8">

        {/* Subject */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Subject</p>
          <div className="grid grid-cols-7 gap-2">
            {SUBJECTS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => onSubject(s.value)}
                className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border text-center transition-all ${
                  subject === s.value
                    ? 'border-accent bg-[rgba(232,98,58,0.08)] shadow-[0_0_0_2px_rgba(232,98,58,0.2)]'
                    : 'border-edge bg-surface hover:border-[var(--muted)]'
                }`}
              >
                <span className="text-[22px]">{s.emoji}</span>
                <span className={`text-[11px] font-semibold leading-tight ${subject === s.value ? 'text-accent' : 'text-muted'}`}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Grade level */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Grade Level</p>
          <div className="grid grid-cols-6 gap-2">
            {GRADES.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => onGrade(g.value)}
                className={`flex flex-col items-start gap-0.5 p-3.5 rounded-xl border text-left transition-all ${
                  gradeLevel === g.value
                    ? 'border-accent bg-[rgba(232,98,58,0.08)]'
                    : 'border-edge bg-surface hover:border-[var(--muted)]'
                }`}
              >
                <span className={`text-[12px] font-semibold leading-tight ${gradeLevel === g.value ? 'text-accent' : 'text-[var(--text)]'}`}>
                  {g.label}
                </span>
                <span className="text-[10px] text-muted font-mono">{g.range}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Language</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <button
                key={l.value}
                type="button"
                onClick={() => onLanguage(l.value)}
                className={`px-4 py-2 rounded-xl border text-[13px] font-medium transition-all ${
                  language === l.value
                    ? 'border-accent bg-[rgba(232,98,58,0.08)] text-accent'
                    : 'border-edge bg-surface text-muted hover:border-[var(--muted)]'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
