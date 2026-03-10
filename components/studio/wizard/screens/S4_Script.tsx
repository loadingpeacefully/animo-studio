'use client'

import { useState } from 'react'
import type { DraftScene } from '@/lib/lessonGenerator'
import type { SceneTag } from '@/lib/types'
import { autoTagScene } from '@/lib/animationStates'

interface S4Props {
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

export function S4_Script({ scenes, onScenes }: S4Props) {
  const [activeId, setActiveId] = useState<string>(scenes[0]?.id ?? '')

  const activeScene = scenes.find(s => s.id === activeId) ?? scenes[0]

  function updateScene(id: string, patch: Partial<DraftScene>) {
    onScenes(scenes.map(s => {
      if (s.id !== id) return s
      const updated = { ...s, ...patch }
      // Auto-retag when script changes
      if (patch.script !== undefined) {
        updated.tag = autoTagScene(patch.script)
      }
      return updated
    }))
  }

  const wordCount = activeScene
    ? activeScene.script.trim().split(/\s+/).filter(Boolean).length
    : 0

  // Word count bar: target 40–80 words per scene
  const wordTarget = 60
  const wordPct = Math.min((wordCount / wordTarget) * 100, 100)
  const wordColor = wordCount < 10 ? '#E53E3E' : wordCount < 40 ? '#F59E0B' : '#0D9488'

  return (
    <div className="flex min-h-screen">

      {/* ── Left: scene list ─────────────────────────────────────────────── */}
      <div className="w-[260px] flex-shrink-0 bg-[#191714] border-r border-edge flex flex-col">
        <div className="px-5 py-5 border-b border-edge">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Step 04 · Script</p>
          <p className="text-[13px] font-semibold text-[var(--text)] mt-1">{scenes.length} scenes</p>
        </div>

        <div className="flex-1 overflow-y-auto py-3 scrollbar-dark">
          {scenes.map((scene, i) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => setActiveId(scene.id)}
              className={`w-full text-left px-5 py-3 flex items-start gap-3 transition-colors ${
                scene.id === activeId
                  ? 'bg-[rgba(232,98,58,0.08)] border-r-2 border-accent'
                  : 'hover:bg-[var(--surface-2)]'
              }`}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                style={{ background: TAG_COLORS[scene.tag] }}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-wide" style={{ color: TAG_COLORS[scene.tag] }}>
                  {String(i + 1).padStart(2, '0')} · {TAG_LABELS[scene.tag]}
                </p>
                <p className="text-[12px] text-muted mt-0.5 line-clamp-2 leading-relaxed">
                  {scene.script.substring(0, 60)}…
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: editor ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 py-16">
        {activeScene && (
          <div className="w-full max-w-[600px]">

            {/* Tag pill */}
            <div className="flex items-center gap-3 mb-6">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold font-mono uppercase tracking-widest"
                style={{
                  background: `${TAG_COLORS[activeScene.tag]}18`,
                  color: TAG_COLORS[activeScene.tag],
                  border: `1px solid ${TAG_COLORS[activeScene.tag]}40`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: TAG_COLORS[activeScene.tag] }} />
                {TAG_LABELS[activeScene.tag]}
              </span>
              <span className="text-[11px] text-muted font-mono">Auto-detected from your script</span>
            </div>

            {/* Description (editable) */}
            <div className="mb-5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2 block">
                Scene description
              </label>
              <input
                type="text"
                value={activeScene.description}
                onChange={e => updateScene(activeScene.id, { description: e.target.value })}
                className="w-full bg-surface border border-edge rounded-xl px-4 py-3 text-[13px] text-[var(--text)] focus:outline-none focus:border-accent transition-colors"
                placeholder="Briefly describe what happens in this scene"
              />
            </div>

            {/* Script — warm canvas textarea */}
            <div className="mb-4">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2 block">
                Script — what Max says
              </label>
              <div
                className="dot-grid rounded-2xl border-2 border-[var(--warm-edge)] focus-within:border-accent transition-colors p-6"
                style={{ background: 'var(--canvas)' }}
              >
                <textarea
                  value={activeScene.script}
                  onChange={e => updateScene(activeScene.id, { script: e.target.value })}
                  rows={7}
                  className="w-full bg-transparent text-[16px] text-[#1C1917] leading-[1.7] resize-none outline-none placeholder:text-[#BDB9B2]"
                  placeholder="Write exactly what Max will say to the student…"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                />
              </div>
            </div>

            {/* Word count bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-edge rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full word-bar-fill transition-all"
                  style={{ width: `${wordPct}%`, background: wordColor }}
                />
              </div>
              <span className="text-[11px] font-mono" style={{ color: wordColor }}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
              <span className="text-[11px] font-mono text-muted">· aim for 40–80</span>
            </div>

          </div>
        )}
      </div>

    </div>
  )
}
