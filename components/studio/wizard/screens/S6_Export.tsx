'use client'

import { useState } from 'react'
import { useCourseStore } from '@/lib/courseStore'

export function S6_Export() {
  const { blueprint, characterPackage, modules, buildExportZip } = useCourseStore()
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [cmsOpen, setCmsOpen]         = useState(false)

  if (!blueprint) return null

  const totalTasks = modules.reduce((s, m) => s + m.tasks.length, 0)
  const totalMinutes = blueprint.modules.reduce((s, m) => s + (m.estimatedMinutes ?? 8), 0)

  async function handleDownload() {
    setDownloading(true)
    try {
      const blob = await buildExportZip()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${blueprint!.courseSlug}-course.zip`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  async function handleCopy() {
    const payload = {
      courseTitle:      blueprint!.courseTitle,
      courseSlug:       blueprint!.courseSlug,
      character:        characterPackage?.character,
      world:            characterPackage?.world,
      modules:          modules.map(m => ({ moduleId: m.moduleId, title: m.title, tasks: m.tasks })),
      generatedAt:      new Date().toISOString(),
    }
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full overflow-y-auto px-8 py-20">

      <p className="fade-up-1 text-[11px] font-mono uppercase tracking-widest text-muted mb-8">
        Step 06 · Export
      </p>

      <h2 className="fade-up-2 font-display text-[48px] font-semibold text-[var(--text)] text-center leading-tight mb-2 max-w-xl">
        {blueprint.courseTitle}
      </h2>
      <p className="fade-up-2 text-[14px] text-muted text-center mb-10 max-w-lg">
        {blueprint.premise}
      </p>

      {/* Stats */}
      <div className="fade-up-3 grid grid-cols-4 gap-4 mb-10 w-full max-w-[700px]">
        {[
          { label: 'Modules',  value: modules.length },
          { label: 'Tasks',    value: totalTasks },
          { label: 'Minutes',  value: `~${totalMinutes}` },
          { label: 'Character',value: characterPackage?.character.name ?? '—' },
        ].map(stat => (
          <div key={stat.label} className="p-4 bg-surface border border-edge rounded-xl text-center">
            <p className="font-bold text-[28px] text-[var(--text)] leading-none mb-1">{stat.value}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div className="fade-up-3 flex gap-4 mb-10">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-[15px] transition-colors disabled:opacity-60"
        >
          {downloading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" /> Preparing…</>
          ) : (
            <><span>📦</span> Download ZIP</>
          )}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-surface hover:bg-[var(--surface-2)] border border-edge text-[var(--text)] font-semibold text-[15px] transition-colors"
        >
          <span>{copied ? '✓' : '📋'}</span> {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>

      {/* ZIP contents info */}
      <div className="fade-up-3 w-full max-w-[700px] mb-6">
        <div className="p-4 bg-surface border border-edge rounded-xl">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-3">ZIP Contents</p>
          <div className="space-y-1.5">
            {modules.map(m => (
              <div key={m.moduleId} className="flex items-center justify-between text-[12px]">
                <span className="font-mono text-[var(--text)]">{m.moduleId}.json</span>
                <span className="text-muted">{m.tasks.length} tasks</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-[12px] pt-1 border-t border-edge mt-2">
              <span className="font-mono text-[var(--text)]">course-manifest.json</span>
              <span className="text-muted">metadata</span>
            </div>
          </div>
        </div>
      </div>

      {/* CMS import instructions */}
      <div className="fade-up-3 w-full max-w-[700px]">
        <button
          type="button"
          onClick={() => setCmsOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-surface border border-edge rounded-xl text-[13px] font-medium text-[var(--text)] hover:border-[var(--muted)] transition-colors"
        >
          <span>CMS Import Instructions</span>
          <span className="text-muted text-[10px] font-mono">{cmsOpen ? '▲ collapse' : '▼ expand'}</span>
        </button>

        {cmsOpen && (
          <div className="mt-3 p-5 bg-surface border border-edge rounded-xl text-[13px] text-muted space-y-2">
            <p>1. Unzip the downloaded archive — you&apos;ll find one JSON file per module.</p>
            <p>2. In the BrightChamps CMS, navigate to <strong className="text-[var(--text)]">Content → Import Module</strong>.</p>
            <p>3. Upload each <code className="text-accent font-mono text-[11px]">[MODULE_ID].json</code> file individually.</p>
            <p>4. Check <code className="text-accent font-mono text-[11px]">course-manifest.json</code> to verify task counts match after import.</p>
            <p>5. Set module order in the CMS to match the moduleNumber sequence.</p>
          </div>
        )}
      </div>

    </div>
  )
}
