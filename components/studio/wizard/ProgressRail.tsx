'use client'

interface ProgressRailProps {
  currentStep: number   // 1-based (S1=1, S2=2...)
  totalSteps: number    // 6 (S1 through S6 — S0 has no rail)
}

const STEP_LABELS = ['Brief', 'Blueprint', 'Character', 'Generate', 'Preview', 'Export']

export function ProgressRail({ currentStep, totalSteps }: ProgressRailProps) {
  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col z-20">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum    = i + 1
        const isComplete = stepNum < currentStep
        const isCurrent  = stepNum === currentStep
        const isFuture   = stepNum > currentStep

        return (
          <div key={stepNum} className="flex items-start gap-3">
            {/* Dot + vertical connector */}
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300"
                style={{
                  background:  isComplete ? 'var(--teal)' : isCurrent ? 'var(--accent)' : 'transparent',
                  border:      isFuture ? '2px solid var(--edge)' : 'none',
                  boxShadow:   isCurrent ? '0 0 0 3px rgba(232,98,58,0.2)' : 'none',
                }}
              />
              {i < totalSteps - 1 && (
                <div
                  className="w-[2px] rounded-full my-1.5 transition-colors duration-300"
                  style={{
                    height: '26px',
                    background: isComplete ? 'var(--teal)' : 'var(--edge)',
                  }}
                />
              )}
            </div>

            {/* Label */}
            <span
              className="text-[10px] font-mono uppercase tracking-widest leading-[12px] whitespace-nowrap transition-colors duration-300"
              style={{
                color:        isCurrent ? 'var(--text)' : isComplete ? 'var(--teal)' : 'var(--edge)',
                marginBottom: i < totalSteps - 1 ? '26px' : 0,
              }}
            >
              {STEP_LABELS[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
