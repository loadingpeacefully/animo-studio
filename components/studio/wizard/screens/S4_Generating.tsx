'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useCourseStore } from '@/lib/courseStore'
import { MAX_CHARACTER } from '@/lib/characters/max'
import type { GeneratedModule } from '@/lib/courseGenerator/types'

const SpineCanvas = dynamic(
  () => import('@/components/spine/SpineCanvas').then(m => ({ default: m.SpineCanvas })),
  { ssr: false }
)

type ModuleStatus = 'pending' | 'generating' | 'done'

export function S4_Generating({ onAllDone }: { onAllDone: () => void }) {
  const { brief, blueprint, characterPackage, addModule, setProgress } = useCourseStore()
  const [statuses, setStatuses]     = useState<ModuleStatus[]>([])
  const [terminalText, setTerminal] = useState('')
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [anim, setAnim]             = useState('left_loop')
  const terminalRef                 = useRef<HTMLDivElement>(null)
  const hasStarted                  = useRef(false)

  useEffect(() => {
    if (hasStarted.current || !blueprint || !brief || !characterPackage) return
    hasStarted.current = true

    const total = blueprint.modules.length
    setStatuses(Array(total).fill('pending'))
    setProgress({ status: 'generating-modules', currentModule: 0, totalModules: total, completedModules: [] })

    async function runGeneration() {
      for (let i = 0; i < blueprint!.modules.length; i++) {
        const moduleSpec = blueprint!.modules[i]

        setCurrentIdx(i)
        setStatuses(prev => prev.map((s, idx) => idx === i ? 'generating' : s))
        setTerminal('')
        setAnim('left_loop')

        setProgress({
          status: 'generating-modules',
          currentModule: i,
          totalModules: total,
          completedModules: [],
        })

        try {
          const res = await fetch('/api/generate/module', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brief, blueprint, characterPackage, moduleSpec }),
          })

          if (!res.body) throw new Error('No stream body')

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let accumulated = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            accumulated += chunk

            const doneIdx = accumulated.indexOf('\n__DONE__')
            const errIdx  = accumulated.indexOf('\n__ERROR__')

            if (doneIdx !== -1) {
              const moduleJson = accumulated.slice(doneIdx + '\n__DONE__'.length)
              const generatedModule: GeneratedModule = JSON.parse(moduleJson)
              addModule(generatedModule)
              setAnim('right_loop')
              setTimeout(() => setAnim('left_loop'), 1200)
              setStatuses(prev => prev.map((s, idx) => idx === i ? 'done' : s))
              break
            } else if (errIdx !== -1) {
              const msg = accumulated.slice(errIdx + '\n__ERROR__'.length)
              console.error('Module generation error:', msg)
              setStatuses(prev => prev.map((s, idx) => idx === i ? 'done' : s))
              break
            } else {
              setTerminal(accumulated.replace(/\n__DONE__.*$/, ''))
            }
          }
        } catch (e) {
          console.error('Stream error:', e)
          setStatuses(prev => prev.map((s, idx) => idx === i ? 'done' : s))
        }
      }

      setProgress({
        status: 'complete',
        currentModule: blueprint!.modules.length,
        totalModules: blueprint!.modules.length,
        completedModules: [],
      })

      setTimeout(onAllDone, 800)
    }

    runGeneration()
  }, [blueprint, brief, characterPackage, addModule, setProgress, onAllDone])

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalText])

  if (!blueprint) return null

  return (
    <div className="flex h-full overflow-hidden px-8">
      <div className="flex gap-8 w-full max-w-[1100px] mx-auto items-start mt-16">

        {/* Left: module list (30%) */}
        <div className="w-[260px] flex-shrink-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-4">Modules</p>
          <div className="flex flex-col gap-2">
            {blueprint.modules.map((mod, i) => {
              const status = statuses[i] ?? 'pending'
              return (
                <div
                  key={mod.moduleId}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                    status === 'generating'
                      ? 'border-accent bg-[rgba(232,98,58,0.06)] shadow-[0_0_12px_rgba(232,98,58,0.15)]'
                      : status === 'done'
                      ? 'border-[rgba(76,175,125,0.3)] bg-[rgba(76,175,125,0.04)]'
                      : 'border-edge bg-surface'
                  }`}
                >
                  <span className="text-[14px] flex-shrink-0">
                    {status === 'generating' ? '⚡' : status === 'done' ? '✅' : '⏳'}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[11px] font-medium truncate ${
                      status === 'generating' ? 'text-accent' :
                      status === 'done' ? 'text-live' : 'text-muted'
                    }`}>
                      {mod.title}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Center: Spine + terminal (70%) */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Header */}
          <div className="text-center">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-1">Step 04 · Generate</p>
            <h2 className="font-display text-[36px] font-semibold text-[var(--text)]">
              {currentIdx >= 0
                ? `Generating module ${currentIdx + 1} of ${blueprint.modules.length}…`
                : 'Starting generation…'}
            </h2>
          </div>

          {/* Spine */}
          <div className="flex justify-center">
            <div className="w-[200px] h-[200px] rounded-2xl overflow-hidden bg-[#191714]">
              <SpineCanvas
                character={MAX_CHARACTER}
                animationName={anim}
                loop={true}
                backgroundColor="#191714"
                width={200}
                height={200}
              />
            </div>
          </div>

          {/* Terminal */}
          <div
            ref={terminalRef}
            className="h-[240px] overflow-y-auto rounded-xl border border-edge bg-[#0E0C0A] p-4"
          >
            <pre className="text-[11px] font-mono text-[#86D826] leading-relaxed whitespace-pre-wrap break-all">
              {terminalText || (currentIdx < 0 ? '// Initializing…' : `// Module ${currentIdx + 1}: ${blueprint.modules[currentIdx]?.title ?? ''}\n// Streaming…`)}
            </pre>
          </div>

        </div>

      </div>
    </div>
  )
}
