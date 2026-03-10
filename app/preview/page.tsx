'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCourseStore } from '@/lib/courseStore'
import { TaskRenderer } from '@/components/previewer/TaskRenderer'
import type { Task, GeneratedModule } from '@/lib/courseGenerator/types'

// Template label & color map for the badge
const TEMPLATE_META: Record<string, { label: string; color: string }> = {
  'activity-conversation':       { label: 'Conversation',    color: '#D4A017' },
  'readonly':                    { label: 'Read',            color: '#3ABDE8' },
  'activity-mcq':                { label: 'Multiple Choice', color: '#E8623A' },
  'activity-fill-blanks':        { label: 'Fill Blanks',     color: '#7C3AED' },
  'activity-reorder':            { label: 'Reorder',         color: '#0D9488' },
  'activity-flip-multi-card':    { label: 'Flip Cards',      color: '#E85146' },
  'activity-table':              { label: 'Table',           color: '#3ABDE8' },
  'activity-bucketing':          { label: 'Sort',            color: '#4CAF7D' },
  'activity-linking':            { label: 'Match',           color: '#D4A017' },
  'activity-character-feedback': { label: 'Feedback',        color: '#E8623A' },
}

// ─── Device frame ─────────────────────────────────────────────────────────────
// Rendered at 920×560 internally, scaled down to 800×487 for the viewport

const FRAME_W = 920
const FRAME_H = 560
const SCALE   = 800 / 920                       // ≈ 0.8696
const VIS_W   = 800
const VIS_H   = Math.round(FRAME_H * SCALE)     // 487

function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: VIS_W, height: VIS_H, flexShrink: 0, position: 'relative' }}>
      <div
        className="relative rounded-[24px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        style={{
          width:           FRAME_W,
          height:          FRAME_H,
          border:          '2px solid rgba(255,255,255,0.08)',
          background:      '#F5F0E8',
          transform:       `scale(${SCALE})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Preview page ─────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const router = useRouter()
  const { blueprint, modules: storeModules } = useCourseStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Can load from store OR from JSON upload
  const [uploadedModules, setUploadedModules] = useState<GeneratedModule[]>([])
  const [uploadedTitle,   setUploadedTitle]   = useState<string>('')

  // Active module + task index
  const [activeModIdx,  setActiveModIdx]  = useState(0)
  const [activeTaskIdx, setActiveTaskIdx] = useState(0)

  // Which modules to use
  const hasStore  = storeModules.length > 0
  const modules   = uploadedModules.length > 0 ? uploadedModules : storeModules
  const pageTitle = uploadedModules.length > 0 ? uploadedTitle : (blueprint?.courseTitle ?? 'Preview')

  const activeMod  = modules[activeModIdx]
  const tasks: Task[] = activeMod?.tasks ?? []
  const task = tasks[activeTaskIdx]

  // ── JSON upload handler ───────────────────────────────────────────────────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        // Single module JSON array (like the export format)
        if (Array.isArray(parsed) && parsed[0]?.moduleId) {
          const moduleId = parsed[0].moduleId
          const mod: GeneratedModule = {
            moduleId,
            title: file.name.replace('.json', ''),
            tasks: parsed,
            generatedAt: new Date().toISOString(),
          }
          setUploadedModules([mod])
          setUploadedTitle(file.name.replace('.json', ''))
          setActiveModIdx(0)
          setActiveTaskIdx(0)
        }
      } catch {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }, [])

  function goNextTask() {
    if (activeTaskIdx < tasks.length - 1) {
      setActiveTaskIdx(t => t + 1)
    } else if (activeModIdx < modules.length - 1) {
      setActiveModIdx(m => m + 1)
      setActiveTaskIdx(0)
    }
  }

  function goPrevTask() {
    if (activeTaskIdx > 0) {
      setActiveTaskIdx(t => t - 1)
    } else if (activeModIdx > 0) {
      const prevMod = modules[activeModIdx - 1]
      setActiveModIdx(m => m - 1)
      setActiveTaskIdx(prevMod.tasks.length - 1)
    }
  }

  function switchMod(idx: number) {
    setActiveModIdx(idx)
    setActiveTaskIdx(0)
  }

  const totalTasksBefore = modules.slice(0, activeModIdx).reduce((s, m) => s + m.tasks.length, 0)
  const globalTaskNum    = totalTasksBefore + activeTaskIdx + 1
  const globalTotal      = modules.reduce((s, m) => s + m.tasks.length, 0)
  const templateMeta     = task ? (TEMPLATE_META[task.template] ?? { label: task.template, color: '#8A8580' }) : null
  const isFirst          = activeModIdx === 0 && activeTaskIdx === 0
  const isLast           = activeModIdx === modules.length - 1 && activeTaskIdx === tasks.length - 1

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ background: '#1C1917' }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[12px] font-mono text-muted hover:text-[#F5F0E8] transition-colors flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="w-px h-4 bg-edge" />
          <span className="text-[13px] font-semibold text-[#F5F0E8] truncate max-w-[280px]">
            {pageTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Upload JSON button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-edge text-muted hover:border-[#8A8580] hover:text-[#F5F0E8] transition-colors"
          >
            Load JSON
          </button>
          {uploadedModules.length > 0 && (
            <button
              type="button"
              onClick={() => { setUploadedModules([]); setActiveModIdx(0); setActiveTaskIdx(0) }}
              className="text-[11px] font-mono text-muted hover:text-red-400 transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar: module list */}
        {modules.length > 1 && (
          <div
            className="w-[200px] flex-shrink-0 h-full border-r overflow-y-auto py-4"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted px-4 mb-3">
              Modules
            </p>
            {modules.map((mod, i) => (
              <button
                key={mod.moduleId}
                type="button"
                onClick={() => switchMod(i)}
                className="w-full text-left px-4 py-2.5 transition-colors"
                style={{
                  background:  activeModIdx === i ? 'rgba(232,98,58,0.08)' : 'transparent',
                  borderLeft:  activeModIdx === i ? '2px solid #E8623A' : '2px solid transparent',
                }}
              >
                <p className={`text-[11px] font-medium truncate ${activeModIdx === i ? 'text-accent' : 'text-muted'}`}>
                  {String(i + 1).padStart(2, '0')} {mod.title}
                </p>
                <p className="text-[10px] font-mono text-[#3A3530] mt-0.5">
                  {mod.tasks.length} tasks
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Center: device + controls */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 overflow-hidden">

          {modules.length === 0 ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-muted font-mono text-[13px]">No course loaded.</p>
              <p className="text-[#3A3530] text-[12px] max-w-xs">
                Generate a course through the wizard, or load a module JSON file above.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-accent text-white text-[13px] font-semibold rounded-xl hover:bg-[#d4542f] transition-colors"
              >
                Load Module JSON
              </button>
            </div>
          ) : (
            <>
              {/* Template badge + task counter */}
              <div className="flex items-center gap-3 w-[800px]">
                {templateMeta && (
                  <span
                    className="text-[10px] font-semibold font-mono uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{
                      background: templateMeta.color + '20',
                      color:      templateMeta.color,
                      border:     `1px solid ${templateMeta.color}40`,
                    }}
                  >
                    {templateMeta.label}
                  </span>
                )}
                <span className="text-[11px] font-mono text-muted ml-auto">
                  Task {activeTaskIdx + 1} of {tasks.length}
                  <span className="text-[#3A3530]"> · {globalTaskNum} / {globalTotal} total</span>
                </span>
              </div>

              {/* Device frame */}
              <DeviceFrame>
                {task ? (
                  <TaskRenderer key={`${task.moduleId}-${task.rank}`} task={task} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted font-mono text-[12px]">No tasks in this module.</p>
                  </div>
                )}
              </DeviceFrame>

              {/* Task navigation */}
              <div
                className="flex items-center gap-4 px-5 py-3 rounded-2xl border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <button
                  type="button"
                  onClick={goPrevTask}
                  disabled={isFirst}
                  className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-muted hover:text-[#F5F0E8] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                >
                  ← Prev
                </button>

                {/* Dot track */}
                <div className="flex items-center gap-1.5">
                  {tasks.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveTaskIdx(i)}
                      className="rounded-full transition-all"
                      style={{
                        width:      i === activeTaskIdx ? 20 : 6,
                        height:     6,
                        background: i === activeTaskIdx ? '#E8623A' : i < activeTaskIdx ? 'rgba(76,175,125,0.6)' : 'rgba(255,255,255,0.12)',
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goNextTask}
                  disabled={isLast}
                  className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-muted hover:text-[#F5F0E8] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                >
                  Next →
                </button>
              </div>

              {/* Module title */}
              <p className="text-[12px] font-mono text-[#3A3530]">
                {activeMod?.title}
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
