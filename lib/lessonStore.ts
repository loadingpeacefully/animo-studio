// Zustand store — source of truth: reference/LESSON_SCHEMA.md
// Status transitions enforced in advanceStatus() only — never bypass in UI code.

import { create } from 'zustand'
import type { Lesson, LessonStatus, Scene, SceneTag, SubjectArea, GradeLevel, Comment, Character, BackgroundType } from './types'
import { SCENE_TAG_ANIMATIONS, autoTagScene } from './animationStates'
import { MAX_CHARACTER } from './characters/max'

export { MAX_CHARACTER }

// ─── Utilities ───────────────────────────────────────────────────────────────

const generateId = (): string => Math.random().toString(36).slice(2, 11)

const STATUS_ORDER: LessonStatus[] = ['draft', 'review', 'approved', 'published']

// ─── Scene factory ───────────────────────────────────────────────────────────

function makeScene(
  order: number,
  script: string,
  tag: SceneTag,
  background: BackgroundType = 'classroom',
  approved = false,
): Scene {
  return {
    id: generateId(),
    order,
    script,
    tag,
    animationState: SCENE_TAG_ANIMATIONS[tag],
    background,
    approved,
    flagged: false,
    comments: [],
  }
}

// ─── Seeded demo lessons ─────────────────────────────────────────────────────

const DEMO_LESSONS: Lesson[] = [
  {
    id: 'demo-1',
    title: 'What is Money?',
    subject: 'other',
    gradeLevel: '3-5',
    language: 'en',
    status: 'published',
    character: MAX_CHARACTER,
    scenes: [
      makeScene(1, "Hello explorers! Today we're going on an adventure to discover what money really is and why it matters in our everyday lives.", 'explain', 'classroom', true),
      makeScene(2, "Did you know that a long time ago, people didn't have money at all? They traded things — like swapping three fish for a bag of grain. Let's think about that!", 'surprise', 'outdoor', true),
      makeScene(3, "Here's a question for you: if you wanted a new book but only had apples, what would you do? That's exactly why money was invented!", 'question', 'classroom', true),
      makeScene(4, "Money is simply a tool we all agree to use for trading. Coins, notes, even digital numbers in a bank — they're all money!", 'explain', 'abstract-warm', true),
      makeScene(5, "Brilliant work today! You've learned what money is and why it exists. Keep exploring — there's so much more to discover!", 'celebrate', 'classroom', true),
    ],
    estimatedDuration: 420,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-01'),
    publishedAt: new Date('2026-02-05'),
    tags: ['finance', 'money', 'basics'],
  },
  {
    id: 'demo-2',
    title: 'Needs vs Wants',
    subject: 'other',
    gradeLevel: '3-5',
    language: 'en',
    status: 'approved',
    character: MAX_CHARACTER,
    scenes: [
      makeScene(1, "Let's talk about something really important: the difference between things we NEED and things we WANT.", 'explain', 'classroom', true),
      makeScene(2, "A need is something you must have to survive — like food, shelter, and clothing. A want is something nice to have, but you can live without it.", 'think', 'classroom', true),
      makeScene(3, "Can you think of an example of a want? Maybe a new video game or a fancy toy? What about a need? Great thinking!", 'question', 'abstract-warm', true),
      makeScene(4, "Understanding this difference is the first step to being smart with money. Needs come first, then wants if there's money left over!", 'celebrate', 'classroom', true),
    ],
    estimatedDuration: 360,
    createdAt: new Date('2026-01-22'),
    updatedAt: new Date('2026-02-10'),
    tags: ['finance', 'budgeting', 'basics'],
  },
  {
    id: 'demo-3',
    title: 'Introduction to Fractions',
    subject: 'math',
    gradeLevel: '3-5',
    language: 'en',
    status: 'review',
    character: MAX_CHARACTER,
    scenes: [
      makeScene(1, "Today we're going to slice things up — literally! We're learning about fractions.", 'explain', 'classroom', false),
      makeScene(2, "Imagine cutting a pizza into 4 equal slices. If you eat 1 slice, you've eaten one quarter — or one-fourth — of the pizza. That's a fraction!", 'think', 'classroom', false),
      makeScene(3, "Moving on to our challenge: can you write a fraction for two out of eight equal pieces? Remember: the pieces eaten go on top, total pieces go on the bottom.", 'transition', 'abstract-cool', false),
    ],
    estimatedDuration: 300,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-15'),
    tags: ['fractions', 'division', 'basics'],
  },
  {
    id: 'demo-4',
    title: 'The Water Cycle',
    subject: 'science',
    gradeLevel: '6-8',
    language: 'en',
    status: 'draft',
    character: MAX_CHARACTER,
    scenes: [
      makeScene(1, "Have you ever wondered where rain comes from? Or where puddles go after it stops raining? Today we'll uncover the amazing water cycle!", 'surprise', 'outdoor', false),
      makeScene(2, "The water cycle has four main stages: evaporation, condensation, precipitation, and collection. Let's explore each one.", 'explain', 'classroom', false),
    ],
    estimatedDuration: 240,
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-02-20'),
    tags: ['water-cycle', 'weather', 'earth-science'],
  },
]

// ─── Store interface ──────────────────────────────────────────────────────────

interface LessonStore {
  currentLesson: Lesson | null
  lessons: Lesson[]
  activeSceneIndex: number
  isPlaying: boolean
  currentAnimationState: string

  createLesson: (partial: Partial<Lesson>) => Lesson
  updateLesson: (id: string, updates: Partial<Lesson>) => void
  deleteLesson: (id: string) => void

  setCurrentLesson: (lesson: Lesson | null) => void
  setActiveScene: (index: number) => void
  updateScene: (sceneId: string, updates: Partial<Scene>) => void
  addScene: (afterIndex?: number) => Scene
  removeScene: (sceneId: string) => void
  reorderScenes: (fromIndex: number, toIndex: number) => void

  approveScene: (sceneId: string) => void
  flagScene: (sceneId: string, flagged?: boolean) => void
  addComment: (sceneId: string, text: string, author?: string) => void
  resolveComment: (sceneId: string, commentId: string) => void

  // Enforces draft → review → approved → published — never bypass
  advanceStatus: (lessonId: string) => void

  setPlaying: (playing: boolean) => void
  setAnimationState: (state: string) => void
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useLessonStore = create<LessonStore>((set, get) => ({
  currentLesson: null,
  lessons: DEMO_LESSONS,
  activeSceneIndex: 0,
  isPlaying: false,
  currentAnimationState: SCENE_TAG_ANIMATIONS['explain'],

  createLesson: (partial) => {
    const lesson: Lesson = {
      id: generateId(),
      title: partial.title ?? 'Untitled Lesson',
      subject: partial.subject ?? 'other',
      gradeLevel: partial.gradeLevel ?? '3-5',
      language: partial.language ?? 'en',
      status: 'draft',
      character: partial.character ?? MAX_CHARACTER,
      scenes: partial.scenes ?? [],
      estimatedDuration: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: partial.tags ?? [],
      ...partial,
    }
    set(state => ({ lessons: [...state.lessons, lesson] }))
    return lesson
  },

  updateLesson: (id, updates) => {
    set(state => ({
      lessons: state.lessons.map(l =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l
      ),
      currentLesson:
        state.currentLesson?.id === id
          ? { ...state.currentLesson, ...updates, updatedAt: new Date() }
          : state.currentLesson,
    }))
  },

  deleteLesson: (id) => {
    set(state => ({
      lessons: state.lessons.filter(l => l.id !== id),
      currentLesson: state.currentLesson?.id === id ? null : state.currentLesson,
    }))
  },

  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),

  setActiveScene: (index) => {
    const { currentLesson } = get()
    const scene = currentLesson?.scenes[index]
    set({
      activeSceneIndex: index,
      currentAnimationState: scene?.animationState ?? SCENE_TAG_ANIMATIONS['explain'],
    })
  },

  updateScene: (sceneId, updates) => {
    const updateInLesson = (lesson: Lesson): Lesson => ({
      ...lesson,
      updatedAt: new Date(),
      scenes: lesson.scenes.map(s =>
        s.id === sceneId ? { ...s, ...updates } : s
      ),
    })
    set(state => ({
      lessons: state.lessons.map(l =>
        l.scenes.some(s => s.id === sceneId) ? updateInLesson(l) : l
      ),
      currentLesson: state.currentLesson?.scenes.some(s => s.id === sceneId)
        ? updateInLesson(state.currentLesson)
        : state.currentLesson,
    }))
  },

  addScene: (afterIndex) => {
    const { currentLesson } = get()
    if (!currentLesson) throw new Error('No active lesson')

    const insertAt = afterIndex !== undefined ? afterIndex + 1 : currentLesson.scenes.length
    const newScene: Scene = makeScene(insertAt + 1, '', 'explain')

    const updatedScenes = [
      ...currentLesson.scenes.slice(0, insertAt),
      newScene,
      ...currentLesson.scenes.slice(insertAt),
    ].map((s, i) => ({ ...s, order: i + 1 }))

    const updatedLesson = { ...currentLesson, scenes: updatedScenes, updatedAt: new Date() }
    set(state => ({
      currentLesson: updatedLesson,
      lessons: state.lessons.map(l => l.id === currentLesson.id ? updatedLesson : l),
    }))
    return newScene
  },

  removeScene: (sceneId) => {
    const { currentLesson } = get()
    if (!currentLesson) return

    const updatedScenes = currentLesson.scenes
      .filter(s => s.id !== sceneId)
      .map((s, i) => ({ ...s, order: i + 1 }))

    const updatedLesson = { ...currentLesson, scenes: updatedScenes, updatedAt: new Date() }
    set(state => ({
      currentLesson: updatedLesson,
      lessons: state.lessons.map(l => l.id === currentLesson.id ? updatedLesson : l),
      activeSceneIndex: Math.min(state.activeSceneIndex, Math.max(0, updatedScenes.length - 1)),
    }))
  },

  reorderScenes: (fromIndex, toIndex) => {
    const { currentLesson } = get()
    if (!currentLesson) return

    const scenes = [...currentLesson.scenes]
    const [moved] = scenes.splice(fromIndex, 1)
    scenes.splice(toIndex, 0, moved)
    const reordered = scenes.map((s, i) => ({ ...s, order: i + 1 }))

    const updatedLesson = { ...currentLesson, scenes: reordered, updatedAt: new Date() }
    set(state => ({
      currentLesson: updatedLesson,
      lessons: state.lessons.map(l => l.id === currentLesson.id ? updatedLesson : l),
    }))
  },

  approveScene: (sceneId) => {
    get().updateScene(sceneId, { approved: true, flagged: false })
  },

  flagScene: (sceneId, flagged = true) => {
    get().updateScene(sceneId, { flagged, approved: flagged ? false : undefined })
  },

  addComment: (sceneId, text, author = 'Reviewer') => {
    const { currentLesson } = get()
    if (!currentLesson) return
    const scene = currentLesson.scenes.find(s => s.id === sceneId)
    if (!scene) return

    const comment: Comment = {
      id: generateId(),
      author,
      text,
      createdAt: new Date(),
      resolved: false,
    }
    get().updateScene(sceneId, { comments: [...scene.comments, comment] })
  },

  resolveComment: (sceneId, commentId) => {
    const { currentLesson } = get()
    if (!currentLesson) return
    const scene = currentLesson.scenes.find(s => s.id === sceneId)
    if (!scene) return

    get().updateScene(sceneId, {
      comments: scene.comments.map(c => c.id === commentId ? { ...c, resolved: true } : c),
    })
  },

  // Status machine — enforces draft → review → approved → published
  // NEVER bypass this function with direct updateLesson calls
  advanceStatus: (lessonId) => {
    const lesson = get().lessons.find(l => l.id === lessonId)
    if (!lesson) return

    const currentIndex = STATUS_ORDER.indexOf(lesson.status)
    const nextStatus = STATUS_ORDER[currentIndex + 1]
    if (!nextStatus) return // already published

    if (nextStatus === 'approved') {
      const allApproved = lesson.scenes.every(s => s.approved)
      if (!allApproved) {
        throw new Error('All scenes must be approved before the lesson can be approved.')
      }
    }

    set(state => ({
      lessons: state.lessons.map(l =>
        l.id === lessonId
          ? { ...l, status: nextStatus, updatedAt: new Date(), publishedAt: nextStatus === 'published' ? new Date() : l.publishedAt }
          : l
      ),
    }))
  },

  setPlaying: (playing) => set({ isPlaying: playing }),

  setAnimationState: (state) => set({ currentAnimationState: state }),
}))

// ─── Computed helpers (use in components, not in store actions) ───────────────

export function computeEstimatedDuration(scenes: Scene[]): number {
  return scenes.reduce((sum, s) => sum + (s.voiceoverDuration ?? 0), 0)
}

export function resolveSubjectLabel(subject: SubjectArea): string {
  const labels: Record<SubjectArea, string> = {
    math: 'Math', science: 'Science', english: 'English',
    history: 'History', geography: 'Geography', art: 'Art', other: 'Other',
  }
  return labels[subject]
}

export function resolveGradeLabel(grade: GradeLevel): string {
  const labels: Record<GradeLevel, string> = {
    'K-2': 'Grades K–2', '3-5': 'Grades 3–5', '6-8': 'Grades 6–8',
    '9-12': 'Grades 9–12', 'higher-ed': 'Higher Ed', 'adult': 'Adult',
  }
  return labels[grade]
}

export function formatDuration(seconds: number): string {
  if (seconds === 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}
