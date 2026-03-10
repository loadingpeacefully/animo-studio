'use client'

interface CircleRevealProps {
  phase: 'idle' | 'expanding' | 'collapsing'
}

export function CircleReveal({ phase }: CircleRevealProps) {
  if (phase === 'idle') return null

  return (
    <div
      className={phase === 'expanding' ? 'circle-expanding' : 'circle-collapsing'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'var(--bg)',
        pointerEvents: 'none',
      }}
    />
  )
}
