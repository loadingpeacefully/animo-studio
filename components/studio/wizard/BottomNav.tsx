'use client'

interface BottomNavProps {
  currentStep: number   // 1-based
  totalSteps: number    // 6
  stepName: string
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
}

export function BottomNav({
  currentStep,
  totalSteps,
  stepName,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
}: BottomNavProps) {
  const stepStr = String(currentStep).padStart(2, '0')
  const totalStr = String(totalSteps).padStart(2, '0')

  return (
    <div>
      <div className="flex items-center gap-1 bg-surface border border-edge rounded-2xl px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-muted hover:text-[var(--text)] rounded-xl transition-colors"
        >
          ← Back
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-edge" />

        {/* Step indicator */}
        <div className="px-4 py-2 text-center">
          <span className="text-[11px] font-mono text-muted">
            Step {stepStr} of {totalStr}
          </span>
          <span className="text-[11px] font-mono text-edge mx-2">·</span>
          <span className="text-[11px] font-mono text-[var(--text)]">{stepName}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-edge" />

        {/* Continue */}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="flex items-center gap-1.5 px-5 py-2 bg-accent text-white text-[12px] font-semibold rounded-xl hover:bg-[var(--accent-h)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {nextLabel} →
        </button>
      </div>
    </div>
  )
}
