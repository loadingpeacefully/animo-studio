// All TypeScript interfaces for Animo Studio.
// Source of truth: reference/LESSON_SCHEMA.md
// Do NOT add fields without updating that file.

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
  animationState: string     // resolved via SCENE_TAG_ANIMATIONS — never set directly
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
  json: string               // base64 encoded Spine JSON (or raw JSON string)
  atlas: string              // raw atlas text
  png: string                // base64 encoded PNG spritesheet
  animations: string[]       // available Spine animation names
  bones: number
  slots: number
  tags: string[]             // e.g. ['child', 'cartoon', 'friendly']
  thumbnail: string          // base64 preview image or empty string
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

// ─── BrightChamps export types (strict 1:1 schema) ─────────────────────────

export type ContentSectionType =
  | 'text'
  | 'text-heading'
  | 'text-medium'
  | 'text-small'
  | 'image'
  | 'audio'
  | 'video'
  | 'animation'

export interface ContentSection {
  type: ContentSectionType
  value: string
  style?: Record<string, string>
  contentStyle?: Record<string, string>
  additionalProps?: Record<string, unknown>
}

export interface ActionButton {
  id: number
  variant: 'primary' | 'secondary' | 'icon' | 'text'
  contents: ContentSection[]
  style?: Record<string, string>
  goToStep?: string
}

export interface ConversationCharacter {
  type: 'animation'
  activeAnimation: string
  idleAnimation: string
  characterStyle: Record<string, string>
  animations: Array<{ type: 'json' | 'atlas'; value: string }>
  name: string
  color: string
  url?: string
  dialogues: Array<{ type: 'text'; value: string }>
}

export interface BrightChampsTask {
  moduleId: string
  rank: number
  template: string
  templateOptions: { styles: Record<string, string> }
  active: boolean
  id: string
  conversation?: {
    background: string
    foreground?: string
    actions: ActionButton[]
    characters: ConversationCharacter[]
  }
  content?: {
    sections: ContentSection[]
    actions: ActionButton[]
  }
  mcq?: {
    question: { id: number; contents: ContentSection[] }
    options: Array<{
      id: number
      isCorrect: boolean
      contents: ContentSection[]
      style: Record<string, string>
      selectedStyle: Record<string, string>
      inCorrectStyle: Record<string, string>
      correctStyle?: Record<string, string>
    }>
    multiSelect?: boolean
    showCheckBox?: boolean
    containerStyle?: Record<string, string>
    templateAudio?: {
      correctAudio: { sources: string[] }
      incorrectAudio: { sources: string[] }
    }
  }
  characterFeedbackActivity?: {
    title: ContentSection[]
    type: 'option-button'
    multiSelect: boolean
    optionsFlow: 'horizontal'
    options: Array<{
      id: number
      score: 1 | 3 | 5
      content: ContentSection[]
      goToStep: string
    }>
    actions: ActionButton[]
    tagLabel: string
    characters: ConversationCharacter[]
  }
}
