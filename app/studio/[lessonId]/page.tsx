import Link from 'next/link'

// ─── Phase 2 stub ─────────────────────────────────────────────────────────────
// Full lesson editor workspace arrives in Step 3 (Phase 1).
// For now, show the lesson ID and link back to the dashboard.

interface Props {
  params: { lessonId: string }
}

export default function LessonEditorPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface border border-edge flex items-center justify-center text-2xl mb-6">
        ✦
      </div>
      <h1 className="font-display text-[32px] font-semibold text-[var(--text)] mb-3">
        Editor Workspace
      </h1>
      <p className="text-[14px] text-muted mb-2 max-w-sm">
        The full lesson editor arrives in Phase 1, Step 3.
      </p>
      <p className="text-[11px] font-mono text-edge mb-8">lesson/{params.lessonId}</p>
      <div className="flex items-center gap-3">
        <Link
          href="/lessons"
          className="px-5 py-2.5 bg-surface border border-edge text-[13px] font-medium text-[var(--text)] rounded-xl hover:border-[var(--muted)] transition-colors"
        >
          ← Back to Lessons
        </Link>
        <Link
          href="/studio/new"
          className="px-5 py-2.5 bg-accent text-white text-[13px] font-semibold rounded-xl hover:bg-[var(--accent-h)] transition-colors"
        >
          + New Lesson
        </Link>
      </div>
      <div className="mt-10 px-4 py-2.5 bg-[rgba(124,58,237,0.08)] border border-[rgba(124,58,237,0.2)] rounded-xl">
        <span className="text-[11px] font-mono text-violet uppercase tracking-widest">Phase 1 · Step 3</span>
      </div>
    </div>
  )
}
