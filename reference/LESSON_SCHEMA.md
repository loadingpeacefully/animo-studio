# Lesson Data Schema

All TypeScript interfaces for the project. These live in `/lib/types.ts`.
Do not add fields without updating this file.

---

## Core Types

```typescript
// /lib/types.ts

export type LessonStatus = 'draft' | 'review' | 'approved' | 'published'

export type SceneTag =
  | 'explain'
  | 'think'
  | 'surprise'
  | 'celebrate'
  | 'question'
  | 'transition'

export type SubjectArea =
  | 'math'
  | 'science'
  | 'english'
  | 'history'
  | 'geography'
  | 'art'
  | 'other'

export type GradeLevel =
  | 'K-2'
  | '3-5'
  | '6-8'
  | '9-12'
  | 'higher-ed'
  | 'adult'

export interface Comment {
  id: string
  author: string
  text: string
  createdAt: Date
  resolved: boolean
}

export interface Scene {
  id: string
  order: number
  script: string
  tag: SceneTag
  animationState: string     // resolved Spine animation name e.g. 'left_idle'
  voiceoverUrl?: string      // blob URL or uploaded URL
  voiceoverDuration?: number // seconds
  background: BackgroundType
  approved: boolean
  flagged: boolean
  comments: Comment[]
}

export type BackgroundType =
  | 'white'
  | 'classroom'
  | 'outdoor'
  | 'abstract-warm'
  | 'abstract-cool'
  | 'chalkboard'

export interface Character {
  id: string
  name: string
  json: string               // base64 encoded Spine JSON
  atlas: string              // raw atlas text
  png: string                // base64 encoded PNG spritesheet
  animations: string[]       // available Spine animation names
  bones: number
  slots: number
  tags: string[]             // e.g. ['child', 'cartoon', 'friendly']
  thumbnail: string          // base64 preview image
}

export interface Lesson {
  id: string
  title: string
  subject: SubjectArea
  gradeLevel: GradeLevel
  language: string           // BCP-47 code e.g. 'en', 'hi', 'es', 'ar'
  status: LessonStatus
  character: Character
  scenes: Scene[]
  estimatedDuration: number  // seconds, computed from voiceoverDuration sum
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  tags: string[]             // user-defined tags for search
  sourceLesson?: string      // id of lesson this was localized from
}

export interface ExportConfig {
  lessonId: string
  formats: ExportFormat[]
  includeJson: boolean
  includeAtlas: boolean
  includePng: boolean
  includeScorm: boolean
  includeEmbed: boolean
}

export type ExportFormat = 'zip' | 'mp4' | 'gif' | 'scorm' | 'embed'
```

---

## Zustand Store Shape

```typescript
// /lib/lessonStore.ts

interface LessonStore {
  // Current lesson being edited
  currentLesson: Lesson | null
  
  // All lessons
  lessons: Lesson[]
  
  // Active scene index in the editor
  activeSceneIndex: number
  
  // Studio UI state
  isPlaying: boolean
  currentAnimationState: string
  
  // Actions
  createLesson: (partial: Partial<Lesson>) => Lesson
  updateLesson: (id: string, updates: Partial<Lesson>) => void
  deleteLesson: (id: string) => void
  
  setActiveScene: (index: number) => void
  updateScene: (sceneId: string, updates: Partial<Scene>) => void
  addScene: (afterIndex?: number) => void
  removeScene: (sceneId: string) => void
  reorderScenes: (fromIndex: number, toIndex: number) => void
  
  approveScene: (sceneId: string) => void
  flagScene: (sceneId: string) => void
  addComment: (sceneId: string, text: string) => void
  
  // Status transitions — enforces draft → review → approved → published
  advanceStatus: (lessonId: string) => void
  
  setPlaying: (playing: boolean) => void
  setAnimationState: (state: string) => void
}
```

---

## Status Transition Logic

```typescript
// This logic must live in lessonStore.ts advanceStatus action
// NEVER bypass this in UI code

const STATUS_ORDER: LessonStatus[] = ['draft', 'review', 'approved', 'published']

function advanceStatus(lessonId: string) {
  const lesson = state.lessons.find(l => l.id === lessonId)
  if (!lesson) return

  const currentIndex = STATUS_ORDER.indexOf(lesson.status)
  const nextStatus = STATUS_ORDER[currentIndex + 1]

  if (!nextStatus) return // already published

  // Guard: cannot approve unless all scenes are approved
  if (nextStatus === 'approved') {
    const allApproved = lesson.scenes.every(s => s.approved)
    if (!allApproved) throw new Error('All scenes must be approved before advancing')
  }

  set(state => ({
    lessons: state.lessons.map(l =>
      l.id === lessonId ? { ...l, status: nextStatus } : l
    )
  }))
}
```

---

## Animation Resolution

```typescript
// /lib/animationStates.ts

export const SCENE_TAG_ANIMATIONS: Record<SceneTag, string> = {
  explain:    'left_idle',
  think:      'left_loop',
  surprise:   'right_idle',
  celebrate:  'right_loop',
  question:   'left_loop',
  transition: 'right_idle',
}

export const SCENE_TAG_LABELS: Record<SceneTag, string> = {
  explain:    'Explaining',
  think:      'Thinking',
  surprise:   'Surprised',
  celebrate:  'Celebrating',
  question:   'Asking',
  transition: 'Moving On',
}

// Teacher-friendly tag descriptions for the UI
export const SCENE_TAG_DESCRIPTIONS: Record<SceneTag, string> = {
  explain:    'Character explains calmly — good for introducing concepts',
  think:      'Character looks thoughtful — good for problem-solving moments',
  surprise:   'Character reacts — good for reveals and "aha!" moments',
  celebrate:  'Character celebrates — good for correct answers and achievements',
  question:   'Character looks curious — good for posing questions to students',
  transition: 'Character shifts — good for moving between topics',
}
```

---

## Scene Auto-Tagging Keywords (Rule-Based Fallback)

When AI tagging is unavailable, apply these keyword rules in order:

```typescript
const KEYWORD_RULES: Array<{ keywords: string[]; tag: SceneTag }> = [
  { keywords: ['great job', 'well done', 'excellent', 'perfect', 'correct', 'bravo', 'congrats'], tag: 'celebrate' },
  { keywords: ['think about', 'consider', 'what if', 'imagine', 'wonder', 'hmm', 'let me think'], tag: 'think' },
  { keywords: ['question', 'can you tell me', 'what do you think', 'who can', 'raise your hand'], tag: 'question' },
  { keywords: ['surprise', 'actually', 'did you know', 'interesting fact', 'believe it or not'], tag: 'surprise' },
  { keywords: ['next', 'moving on', 'now let\'s', 'finally', 'in summary', 'to wrap up'], tag: 'transition' },
  // default fallback
]
// If no keywords match → tag: 'explain'
```
