import type { LessonStatus } from '@/lib/types'

// ─── Status badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: LessonStatus
  className?: string
}

const STATUS_CONFIG: Record<LessonStatus, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'bg-[#2A2620] text-muted border border-edge' },
  review:    { label: 'In Review', className: 'bg-[#2A2010] text-[#F59E0B] border border-[rgba(245,158,11,0.3)]' },
  approved:  { label: 'Approved',  className: 'bg-[#102A20] text-teal border border-[rgba(13,148,136,0.3)]' },
  published: { label: 'Published', className: 'bg-[rgba(232,98,58,0.12)] text-accent border border-[rgba(232,98,58,0.3)]' },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { label, className: statusClass } = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none font-mono uppercase tracking-wide ${statusClass} ${className}`}
    >
      {label}
    </span>
  )
}

// ─── Generic pill badge ───────────────────────────────────────────────────────

interface PillBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'teal' | 'dark' | 'phase2'
  className?: string
}

const PILL_STYLES: Record<string, string> = {
  default: 'bg-[var(--surface-2)] text-muted border border-edge',
  accent:  'bg-[rgba(232,98,58,0.12)] text-accent border border-[rgba(232,98,58,0.3)]',
  teal:    'bg-[rgba(13,148,136,0.12)] text-teal border border-[rgba(13,148,136,0.3)]',
  dark:    'bg-bg text-[var(--text)] border border-edge',
  phase2:  'bg-[var(--surface-2)] text-muted border border-edge',
}

export function PillBadge({ children, variant = 'default', className = '' }: PillBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-none ${PILL_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

interface SectionLabelProps {
  children: React.ReactNode
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted font-mono mb-2">
      {children}
    </p>
  )
}
