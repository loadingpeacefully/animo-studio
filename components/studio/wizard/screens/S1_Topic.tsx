'use client'

import { useState, useRef, useEffect } from 'react'

interface S1Props {
  topic: string
  onChange: (topic: string) => void
}

const EXAMPLE_TOPICS = [
  'What is Money?',
  'How do plants make food?',
  'Introduction to Fractions',
  'The Water Cycle',
  'Why do volcanoes erupt?',
]

export function S1_Topic({ topic, onChange }: S1Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const wordCount = topic.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-20">

      {/* Screen label */}
      <p className="fade-up-1 text-[11px] font-mono uppercase tracking-widest text-muted mb-8">
        Step 01 · Topic
      </p>

      {/* Question */}
      <h2 className="fade-up-2 font-display text-[48px] font-semibold text-[var(--text)] text-center leading-tight mb-12 max-w-xl">
        What is your lesson about?
      </h2>

      {/* Input area — warm cream canvas */}
      <div className="fade-up-3 w-full max-w-[640px]">
        <div
          className={`dot-grid rounded-2xl border-2 transition-colors duration-200 px-8 py-8 ${
            focused ? 'border-accent' : 'border-[var(--warm-edge)]'
          }`}
          style={{ background: 'var(--canvas)' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={topic}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. Introduction to Fractions"
            maxLength={120}
            className="w-full bg-transparent text-[28px] font-semibold text-[#1C1917] placeholder:text-[#BDB9B2] outline-none"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-[12px] text-[#8A8178]">
              {wordCount === 0 ? 'Type a topic — be as specific as you like.' : `${topic.length}/120 characters`}
            </p>
            {wordCount > 0 && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-[11px] text-[#8A8178] hover:text-[#1C1917] transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Example topics */}
        <div className="mt-6">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-3">Examples</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_TOPICS.map(ex => (
              <button
                key={ex}
                type="button"
                onClick={() => onChange(ex)}
                className="px-3 py-1.5 bg-surface border border-edge rounded-xl text-[12px] text-muted hover:text-[var(--text)] hover:border-[var(--muted)] transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
