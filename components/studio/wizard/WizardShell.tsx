'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCourseStore } from '@/lib/courseStore'
import type { CourseBrief } from '@/lib/courseGenerator/types'

import { CircleReveal } from './CircleReveal'
import { ProgressRail } from './ProgressRail'
import { BottomNav } from './BottomNav'
import { S0_Welcome } from './screens/S0_Welcome'
import { S1_Brief } from './screens/S1_Brief'
import { S2_Blueprint } from './screens/S2_Blueprint'
import { S3_WorldCharacter } from './screens/S3_WorldCharacter'
import { S4_Generating } from './screens/S4_Generating'
import { S5_CoursePreview } from './screens/S5_CoursePreview'
import { S6_Export } from './screens/S6_Export'

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 0, label: 'Welcome',   emoji: '✨' },
  { id: 1, label: 'Brief',     emoji: '📝' },
  { id: 2, label: 'Blueprint', emoji: '🗺️' },
  { id: 3, label: 'Character', emoji: '🎭' },
  { id: 4, label: 'Generate',  emoji: '⚡' },
  { id: 5, label: 'Preview',   emoji: '👁️' },
  { id: 6, label: 'Export',    emoji: '📦' },
] as const

const ACTIVE_STEPS = 6   // S1–S6 shown in ProgressRail (S0 has no rail)

// ─── Wizard shell ─────────────────────────────────────────────────────────────

export function WizardShell() {
  const router = useRouter()
  const { brief, setBrief, blueprint, characterPackage, reset } = useCourseStore()

  const [step, setStep]             = useState(0)
  const [transition, setTransition] = useState<'idle' | 'expanding' | 'collapsing'>('idle')
  const [draftBrief, setDraftBrief] = useState<Partial<CourseBrief>>({
    tone:          'fun',
    characterRole: 'guide',
    moduleCount:   7,
  })
  // ── Transition helpers ────────────────────────────────────────────────────
  const navigate = useCallback((targetStep: number, afterStep?: () => void) => {
    setTransition('expanding')
    setTimeout(() => {
      setStep(targetStep)
      if (afterStep) afterStep()
      setTransition('collapsing')
      setTimeout(() => setTransition('idle'), 420)
    }, 520)
  }, [])

  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      // S0 → S1: clear previous course data after the screen transitions
      if (step === 0) {
        navigate(1, reset)
        return
      }
      // S1 → S2: commit brief to store before advancing
      if (step === 1 && draftBrief.topic && draftBrief.gradeRange && draftBrief.tone && draftBrief.characterRole && draftBrief.moduleCount) {
        setBrief(draftBrief as CourseBrief)
      }
      navigate(step + 1)
    }
  }, [step, navigate, draftBrief, setBrief, reset])

  const goBack = useCallback(() => {
    if (step === 0) {
      router.push('/')
    } else {
      navigate(step - 1)
    }
  }, [step, navigate, router])

  // ── Can proceed? ──────────────────────────────────────────────────────────
  const canContinue: Record<number, boolean> = {
    0: true,
    1: (draftBrief.topic?.trim().length ?? 0) >= 4 && !!draftBrief.gradeRange,
    2: !!blueprint,
    3: !!characterPackage,
    4: false,    // S4 auto-advances when done
    5: true,
    6: true,
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const showChrome = step > 0   // ProgressRail + BottomNav only on S1–S6
  const isGenerating = step === 4

  return (
    <div className="h-screen bg-bg overflow-hidden flex flex-col">
      {/* Circle reveal overlay */}
      <CircleReveal phase={transition} />

      {/* Progress rail — fixed left, S1–S6 only */}
      {showChrome && (
        <ProgressRail currentStep={step} totalSteps={ACTIVE_STEPS} />
      )}

      {/* Screen content */}
      <div className={`flex-1 overflow-hidden ${showChrome ? 'pl-44' : ''}`}>
        {step === 0 && <S0_Welcome onStart={goNext} />}

        {step === 1 && (
          <S1_Brief
            brief={draftBrief}
            onChange={setDraftBrief}
          />
        )}

        {step === 2 && brief && (
          <S2_Blueprint brief={brief} />
        )}

        {step === 3 && brief && blueprint && (
          <S3_WorldCharacter brief={brief} blueprint={blueprint} />
        )}

        {step === 4 && (
          <S4_Generating onAllDone={() => navigate(5)} />
        )}

        {step === 5 && <S5_CoursePreview onBack={goBack} onContinue={goNext} />}

        {step === 6 && <S6_Export />}
      </div>

      {/* Bottom nav — in-flow flex child, never overlaps content */}
      {showChrome && !isGenerating && step !== 5 && (
        <div
          className="flex-shrink-0 flex items-center justify-center py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <BottomNav
            currentStep={step}
            totalSteps={ACTIVE_STEPS}
            stepName={STEPS[step].label}
            onBack={goBack}
            onNext={goNext}
            nextLabel={step === 6 ? 'Done' : 'Continue'}
            nextDisabled={!canContinue[step]}
          />
        </div>
      )}
    </div>
  )
}
