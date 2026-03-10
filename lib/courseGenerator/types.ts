// Course input from teacher
export interface CourseBrief {
  topic: string;              // "How the Internet Works"
  gradeRange: string;         // "6-8"
  tone: 'fun' | 'serious' | 'adventurous' | 'calm';
  characterRole: 'guide' | 'peer' | 'mentor';
  moduleCount: 5 | 7 | 8 | 10;
  slidesPerModule: 12 | 15 | 20 | 25;  // average tasks/slides per module
  subject?: string;           // optional subject tag
}

// Output of Stage 2
export interface ModuleSpec {
  moduleNumber: number;
  moduleId: string;           // e.g. "COURSE_01"
  title: string;
  conceptTaught: string;      // the ONE thing this module teaches
  storyBeat: string;          // what happens in the character's story
  activityType: ActivityType;
  estimatedMinutes: number;
}

export type ActivityType =
  | 'activity-mcq'
  | 'activity-fill-blanks'
  | 'activity-table'
  | 'activity-reorder'
  | 'activity-flip-multi-card'
  | 'activity-card-flip'
  | 'activity-bucketing'
  | 'activity-linking';

export interface CourseBlueprint {
  courseTitle: string;
  courseSlug: string;         // URL-safe slug, used as moduleId prefix
  premise: string;
  worldSetting: string;
  learningArc: string;
  modules: ModuleSpec[];
}

// Output of Stage 3
export interface CourseCharacter {
  name: string;
  role: 'guide' | 'peer' | 'mentor';
  personality: string;        // "curious, warm, uses analogies"
  speakingStyle: string;
  catchphrase: string;
  color: string;              // hex, used in dialogue bubbles
  animationFile: 'max';       // always 'max' for Phase 1
}

export interface CourseWorld {
  name: string;               // "The Data Realm"
  backgroundTheme: string;    // "neon city at night"
  recurringElement: string;
  openingScene: string;
}

export interface CourseNarrative {
  hook: string;               // opening line character says
  midpointTwist: string;
  finalPayoff: string;
}

export interface CourseCharacterPackage {
  character: CourseCharacter;
  world: CourseWorld;
  narrative: CourseNarrative;
}

// A single generated task (CMS schema)
export interface Task {
  moduleId: string;
  rank: number;
  template: string;
  active: boolean;
  conversation?: ConversationData;
  readonly?: ReadonlyData;
  mcq?: McqData;
  characterFeedbackActivity?: FeedbackData;
  fillBlanks?: FillBlanksData;
  table?: TableData;
  reorder?: ReorderData;
  flipMultiCard?: FlipCardData;
  [key: string]: unknown;
}

export interface ConversationData {
  characters: ConversationCharacter[];
}

export interface ConversationCharacter {
  name: string;
  color: string;
  type: 'animation';
  activeAnimation: string;
  idleAnimation: string;
  animations: Array<{ type: 'json' | 'atlas'; value: string }>;
  dialogues: Array<{ type: 'text'; value: string }>;
}

export interface ReadonlyData {
  content: string | Array<{ type: string; value: string }>;
  title?: string;
}

export interface McqData {
  question: string;
  options: Array<{ id: string; value: string; isCorrect?: boolean }>;
  correctOptionId?: string;
}

export interface FeedbackData {
  message: string;
  correctMessage?: string;
  incorrectMessage?: string;
}

export interface FillBlanksData {
  sentence: string;
  blanks: Array<{ id: string; answer: string }>;
  options?: string[];
}

export interface TableData {
  headers: string[];
  rows: Array<string[]>;
  title?: string;
}

export interface ReorderData {
  items: Array<{ id: string; value: string }>;
  correctOrder: string[];
}

export interface FlipCardData {
  cards: Array<{ front: string; back: string; id: string }>;
}

// Full generated module
export interface GeneratedModule {
  moduleId: string;
  title: string;
  tasks: Task[];
  generatedAt: string;
}

// Full course
export interface GeneratedCourse {
  brief: CourseBrief;
  blueprint: CourseBlueprint;
  characterPackage: CourseCharacterPackage;
  modules: GeneratedModule[];
  generatedAt: string;
}

// Generation state for UI
export type GenerationStatus =
  | 'idle'
  | 'generating-blueprint'
  | 'generating-character'
  | 'generating-modules'
  | 'complete'
  | 'error';

export interface GenerationProgress {
  status: GenerationStatus;
  currentModule: number;       // 0-indexed, -1 if not generating modules
  totalModules: number;
  completedModules: GeneratedModule[];
  error?: string;
}
