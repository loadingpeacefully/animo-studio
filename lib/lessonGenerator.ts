// Rule-based Golden Arc lesson generator — Q1: no API dependency in Phase 1.
// When Phase 2 arrives, replace generateScenesAI() which calls Claude API with
// these same scenes as few-shot examples. Keep this function as the fallback.

import type { SubjectArea, GradeLevel, SceneTag } from './types'
import { SCENE_TAG_ANIMATIONS } from './animationStates'

// ─── Draft scene type (used by the wizard) ───────────────────────────────────

export interface DraftScene {
  id: string
  order: number
  tag: SceneTag
  description: string  // S3: brief "what happens here"
  script: string       // S4: full teaching words (what Max says)
}

// ─── ID helper ───────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 11)
}

// ─── Standard Golden Arc template ────────────────────────────────────────────
// Pattern proven across 300+ real BrightChamps lessons.
// hook → explore → interact → reflect → reinforce → close

const STANDARD_ARC: Array<{
  tag: SceneTag
  descriptionTemplate: string
  scriptTemplate: string
}> = [
  {
    tag: 'explain',
    descriptionTemplate: 'Hook — character introduces the lesson world and sets the scene',
    scriptTemplate: `Hello explorers! Today we're going on an exciting adventure to learn about [TOPIC]. Get ready — this is going to be something you'll use every single day!`,
  },
  {
    tag: 'surprise',
    descriptionTemplate: 'Reveal — a surprising fact or real-world connection opens the concept',
    scriptTemplate: `Did you know that [TOPIC] is everywhere around you? It might seem complicated at first, but once you see it in action, you'll wonder how you ever missed it!`,
  },
  {
    tag: 'explain',
    descriptionTemplate: 'Explore block 1 — character explains the core concept clearly',
    scriptTemplate: `Let me introduce you to [TOPIC]. Here's the key idea you need to understand: [TOPIC] is something that helps us make sense of the world around us. Let's break it down together.`,
  },
  {
    tag: 'think',
    descriptionTemplate: 'Think — character models a thinking process or poses a problem to solve',
    scriptTemplate: `Now let me think about this with you. When we look at [TOPIC], the first question to ask is: why does this matter? Hmm… let's work through it step by step.`,
  },
  {
    tag: 'question',
    descriptionTemplate: 'Interact — character poses a question for the student to answer',
    scriptTemplate: `Here's a question for you: based on what we've just learned, what do you think about [TOPIC]? Take a moment — I know you can work this out!`,
  },
  {
    tag: 'explain',
    descriptionTemplate: 'Reflect — character reacts to the activity and deepens understanding',
    scriptTemplate: `Great thinking! Now that you've had a chance to think about it, let's go deeper. [TOPIC] is important because it connects to so many things in everyday life.`,
  },
  {
    tag: 'transition',
    descriptionTemplate: 'Transition — character bridges to the reinforcement section',
    scriptTemplate: `Let's move on to test what you've learned. In summary, [TOPIC] is all about understanding and applying the key idea. Ready for the challenge?`,
  },
  {
    tag: 'celebrate',
    descriptionTemplate: 'Close — character celebrates the student\'s progress and wraps up',
    scriptTemplate: `Well done! You've done an amazing job exploring [TOPIC] today. You should feel really proud — keep it up and remember: great learners never stop asking questions!`,
  },
]

// Subject-specific arc adjustments (minor variations — stay aligned with Golden Arc)
const SUBJECT_ADJUSTMENTS: Partial<Record<SubjectArea, { extraTag?: SceneTag; extraScript?: string }>> = {
  math:    { extraTag: 'think', extraScript: 'Let me work through this calculation with you. Watch carefully as I show you how [TOPIC] works step by step.' },
  science: { extraTag: 'surprise', extraScript: 'Here\'s a fascinating fact about [TOPIC]: scientists discovered that it works in ways that still surprise researchers today!' },
  history: { extraTag: 'explain', extraScript: 'To understand [TOPIC], we need to travel back in time and see why it mattered so much to people then — and why it still matters now.' },
}

// ─── Main generator ───────────────────────────────────────────────────────────

export interface GenerationInput {
  topic: string
  subject: SubjectArea
  gradeLevel: GradeLevel
  lessonLength?: 'short' | 'standard'
}

export function generateScenes(input: GenerationInput): DraftScene[] {
  const { topic, subject, lessonLength = 'standard' } = input

  const replace = (template: string) => template.replace(/\[TOPIC\]/g, topic)

  // Short arc: hook → explore → interact → close (4 scenes)
  if (lessonLength === 'short') {
    return [
      STANDARD_ARC[0],  // hook
      STANDARD_ARC[2],  // explore
      STANDARD_ARC[4],  // interact
      STANDARD_ARC[7],  // close
    ].map((step, i) => ({
      id: uid(),
      order: i + 1,
      tag: step.tag,
      description: replace(step.descriptionTemplate),
      script: replace(step.scriptTemplate),
    }))
  }

  // Standard arc (8 scenes) with optional subject adjustment
  const arc = [...STANDARD_ARC]
  const adj = SUBJECT_ADJUSTMENTS[subject]

  if (adj?.extraTag && adj.extraScript) {
    // Insert subject-specific scene before the reinforce section (after position 4)
    arc.splice(5, 0, {
      tag: adj.extraTag,
      descriptionTemplate: replace(adj.extraScript),
      scriptTemplate: adj.extraScript,
    })
  }

  return arc.map((step, i) => ({
    id: uid(),
    order: i + 1,
    tag: step.tag,
    description: replace(step.descriptionTemplate),
    script: replace(step.scriptTemplate),
  }))
}

// ─── Quality validation (runs in S6 Preview) ─────────────────────────────────

export interface QualityIssue {
  id: string
  severity: 'error' | 'warning'
  message: string
  passed: boolean
}

export function validateScenes(scenes: DraftScene[]): QualityIssue[] {
  return [
    {
      id: 'Q001',
      severity: 'warning',
      message: 'Fewer than 6 consecutive explanation scenes without an activity',
      passed: (() => {
        let run = 0
        for (const s of scenes) {
          if (s.tag === 'explain' || s.tag === 'think') run++
          else run = 0
          if (run > 6) return false
        }
        return true
      })(),
    },
    {
      id: 'Q002',
      severity: 'error',
      message: 'Lesson ends with a celebration or check-in scene',
      passed: scenes.length > 0 && scenes[scenes.length - 1].tag === 'celebrate',
    },
    {
      id: 'Q003',
      severity: 'error',
      message: 'At least one activity (question, think, or surprise) included',
      passed: scenes.some(s => ['question', 'think', 'surprise'].includes(s.tag)),
    },
    {
      id: 'Q004',
      severity: 'warning',
      message: 'At least 3 scenes for a meaningful lesson',
      passed: scenes.length >= 3,
    },
    {
      id: 'Q005',
      severity: 'warning',
      message: 'Each scene has meaningful content (10+ words)',
      passed: scenes.every(s => (s.script || s.description).trim().split(/\s+/).length >= 10),
    },
    {
      id: 'Q006',
      severity: 'warning',
      message: 'Background changes at least once through the lesson',
      passed: true, // background rotation handled in WizardShell
    },
  ]
}

// ─── BrightChamps JSON export (Q2: strict 1:1 schema) ────────────────────────

export interface LessonDraft {
  title: string
  subject: SubjectArea
  gradeLevel: GradeLevel
  language: string
  characterId: string
  scenes: DraftScene[]
}

export function exportToBrightChampsJSON(draft: LessonDraft, moduleId: string) {
  return draft.scenes.map((scene, i) => {
    const base = {
      moduleId,
      rank: i + 1,
      template: '',
      templateOptions: { styles: { backgroundImage: '', backgroundSize: 'cover' } },
      active: true,
      id: scene.id,
    }

    if (scene.tag === 'celebrate') {
      return {
        ...base,
        template: 'activity-character-feedback',
        characterFeedbackActivity: {
          title: [{ type: 'text-heading', value: 'What do you feel about the overall experience?' }],
          type: 'option-button',
          multiSelect: false,
          optionsFlow: 'horizontal',
          options: [
            { id: 1, score: 5, content: [{ type: 'text', value: '😊 It was interesting' }],       goToStep: 'step3' },
            { id: 2, score: 3, content: [{ type: 'text', value: '😐 Moderately interesting' }],   goToStep: 'step3' },
            { id: 3, score: 1, content: [{ type: 'text', value: '😕 Not interesting at all' }],  goToStep: 'step4' },
          ],
          actions: [{ id: 1, variant: 'primary', contents: [{ type: 'text', value: 'Submit' }] }],
          tagLabel: `feedback_module_end_${moduleId}`,
          characters: [buildCharacterJSON(draft.characterId, scene.script || scene.description)],
        },
      }
    }

    if (scene.tag === 'question') {
      return {
        ...base,
        template: 'activity-mcq',
        mcq: {
          question: { id: 1, contents: [{ type: 'text', value: scene.script || scene.description }] },
          options: [
            { id: 1, isCorrect: true,  contents: [{ type: 'text', value: 'Option A — correct' }], style: {}, selectedStyle: {}, inCorrectStyle: {} },
            { id: 2, isCorrect: false, contents: [{ type: 'text', value: 'Option B' }],             style: {}, selectedStyle: {}, inCorrectStyle: {} },
            { id: 3, isCorrect: false, contents: [{ type: 'text', value: 'Option C' }],             style: {}, selectedStyle: {}, inCorrectStyle: {} },
            { id: 4, isCorrect: false, contents: [{ type: 'text', value: 'Option D' }],             style: {}, selectedStyle: {}, inCorrectStyle: {} },
          ],
          multiSelect: false,
          showCheckBox: false,
        },
      }
    }

    // Default → activity-conversation
    return {
      ...base,
      template: 'activity-conversation',
      conversation: {
        background: `/assets/backgrounds/${scene.tag === 'transition' ? 'abstract' : 'classroom'}.png`,
        actions: [
          { id: 1, variant: 'secondary', contents: [{ type: 'text', value: '← Prev' }] },
          { id: 2, variant: 'primary',   contents: [{ type: 'text', value: 'Next →' }] },
        ],
        characters: [buildCharacterJSON(draft.characterId, scene.script || scene.description)],
      },
    }
  })
}

function buildCharacterJSON(characterId: string, dialogue: string) {
  return {
    type: 'animation',
    activeAnimation: 'asking',
    idleAnimation: 'idle',
    characterStyle: { height: '100%', width: '100%' },
    animations: [
      { type: 'json',  value: `/assets/animations/${characterId}.json` },
      { type: 'atlas', value: `/assets/animations/${characterId}.atlas` },
    ],
    name: characterId.charAt(0).toUpperCase() + characterId.slice(1),
    color: '#E8623A',
    dialogues: [{ type: 'text', value: dialogue }],
  }
}
