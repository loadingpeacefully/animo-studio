// Animation state mapping — source of truth: reference/ANIMATION_STATES.md
// CRITICAL: These are internal Spine names. NEVER expose them in teacher-facing UI.
// Always use SCENE_TAG_LABELS for any user-visible text.

import type { SceneTag } from './types'

// Maps teacher scene tag → internal Spine animation name
export const SCENE_TAG_ANIMATIONS: Record<SceneTag, string> = {
  explain:    'left_idle',
  think:      'left_loop',
  surprise:   'right_idle',
  celebrate:  'right_loop',
  question:   'left_loop',
  transition: 'right_idle',
}

// Teacher-facing labels — the ONLY strings allowed in UI
export const SCENE_TAG_LABELS: Record<SceneTag, string> = {
  explain:    'Explaining',
  think:      'Thinking',
  surprise:   'Surprised',
  celebrate:  'Celebrating',
  question:   'Asking',
  transition: 'Moving On',
}

// Tooltip descriptions for the tag picker
export const SCENE_TAG_DESCRIPTIONS: Record<SceneTag, string> = {
  explain:    'Character explains calmly — good for introducing concepts',
  think:      'Character looks thoughtful — good for problem-solving moments',
  surprise:   'Character reacts — good for reveals and "aha!" moments',
  celebrate:  'Character celebrates — good for correct answers and achievements',
  question:   'Character looks curious — good for posing questions to students',
  transition: 'Character shifts — good for moving between topics',
}

// Emoji icons for each tag (teacher UI only)
export const SCENE_TAG_ICONS: Record<SceneTag, string> = {
  explain:    '💬',
  think:      '🤔',
  surprise:   '😲',
  celebrate:  '🎉',
  question:   '❓',
  transition: '➡️',
}

// Rule-based auto-tagger: applies keyword rules in order, defaults to 'explain'
const KEYWORD_RULES: Array<{ keywords: string[]; tag: SceneTag }> = [
  {
    keywords: ['great job', 'well done', 'excellent', 'perfect', 'correct', 'bravo', 'congrats', 'amazing'],
    tag: 'celebrate',
  },
  {
    keywords: ['think about', 'consider', 'what if', 'imagine', 'wonder', 'hmm', 'let me think'],
    tag: 'think',
  },
  {
    keywords: ['question', 'can you tell me', 'what do you think', 'who can', 'raise your hand', 'what is'],
    tag: 'question',
  },
  {
    keywords: ['surprise', 'actually', 'did you know', 'interesting fact', 'believe it or not', 'fun fact'],
    tag: 'surprise',
  },
  {
    keywords: ['next', 'moving on', "now let's", 'finally', 'in summary', 'to wrap up', "let's move on"],
    tag: 'transition',
  },
]

export function autoTagScene(script: string): SceneTag {
  const lower = script.toLowerCase()
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.tag
    }
  }
  return 'explain'
}

// All valid scene tags in the order they appear in the Golden Arc
export const SCENE_TAGS_ORDERED: SceneTag[] = [
  'explain',
  'think',
  'question',
  'surprise',
  'celebrate',
  'transition',
]
