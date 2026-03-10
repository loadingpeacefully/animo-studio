# Phase 1 · Step 3 — Course Generator Pipeline

## What This Step Builds

A 4-stage AI pipeline that takes a teacher's natural language input and generates
a complete 7–8 module interactive course — full task JSON arrays, character, world,
dialogues — ready for CMS import.

**No RAG. No vector DB. No fine-tuning.**
Claude already knows every topic. Your 172 real lesson JSONs are baked directly into
the system prompt as structural examples. Claude learns your format, not your content.

---

## Files to Create

```
lib/courseGenerator/
├── types.ts                   ← All TypeScript types for this pipeline
├── exampleModules.ts          ← 3 trimmed real modules as few-shot examples
├── systemPrompts.ts           ← System prompt strings for each stage
├── blueprintGenerator.ts      ← Stage 2: course blueprint (7-8 module plan)
├── characterGenerator.ts      ← Stage 3: character + world JSON
├── moduleGenerator.ts         ← Stage 4: full task array per module
└── courseOrchestrator.ts      ← Runs all stages, streams progress

app/api/generate/
├── blueprint/route.ts         ← POST /api/generate/blueprint
├── character/route.ts         ← POST /api/generate/character
└── module/route.ts            ← POST /api/generate/module (streaming)

components/studio/wizard/screens/
├── S1_Brief.tsx               ← REPLACE S1_Audience: topic + grade + tone inputs
├── S2_Blueprint.tsx           ← NEW: 7-8 module cards, teacher can rename/reorder
├── S3_WorldCharacter.tsx      ← NEW: character preview (SpineCanvas) + world panel
├── S4_Generating.tsx          ← NEW: live generation progress, modules pop in
├── S5_CoursePreview.tsx       ← NEW: navigate all modules, task viewer
└── S6_Export.tsx              ← RENAME from current S6: export + CMS import

components/studio/wizard/
├── WizardShell.tsx            ← MOD: update totalSteps 7→6, new screen routing
└── ProgressRail.tsx           ← MOD: 6 dots, new step labels

lib/
├── courseStore.ts             ← NEW: Zustand store for course (replaces lessonStore)
└── courseTypes.ts             ← Re-export from courseGenerator/types.ts
```

---

## Stage Architecture

```
STAGE 1 — S1_Brief (user fills form, no API)
  Input:  topic, gradeRange, tone, characterRole, moduleCount
  Output: CourseBrief object stored in Zustand

STAGE 2 — blueprintGenerator.ts → POST /api/generate/blueprint
  Input:  CourseBrief
  Output: CourseBlueprint { title, premise, modules[7-8], worldSetting, learningArc }
  Time:   ~4 seconds

STAGE 3 — characterGenerator.ts → POST /api/generate/character
  Input:  CourseBlueprint
  Output: CourseCharacter + CourseWorld + CourseNarrative
  Time:   ~4 seconds

STAGE 4 — moduleGenerator.ts → POST /api/generate/module (called 7-8× streaming)
  Input:  CourseBrief + CourseBlueprint + CourseCharacter + ModuleSpec (one at a time)
  Output: TaskArray (20-28 tasks, valid CMS JSON)
  Time:   ~8-12 seconds per module, streamed
```

---

## lib/courseGenerator/types.ts

```typescript
// Course input from teacher
export interface CourseBrief {
  topic: string;              // "How the Internet Works"
  gradeRange: string;         // "6-8"
  tone: 'fun' | 'serious' | 'adventurous' | 'calm';
  characterRole: 'guide' | 'peer' | 'mentor';
  moduleCount: 7 | 8 | 5 | 10;
  subject?: string;           // optional subject tag
}

// Output of Stage 2
export interface ModuleSpec {
  moduleNumber: number;
  moduleId: string;           // e.g. "COURSE_01", generated as SLUG_01
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
```

---

## lib/courseGenerator/exampleModules.ts

This file contains 3 real trimmed modules from the training data.
They are injected into the system prompt as few-shot examples.
**Do not modify these — they are the ground truth for the JSON schema.**

```typescript
// These are REAL modules from the BrightChamps CMS, trimmed for token efficiency.
// They teach Claude the exact JSON schema and dialogue style to produce.

// EXAMPLE 1: Story-driven module (high conversation count)
// Source: ABL10107 — 12 tasks showing conversation-heavy arc
export const EXAMPLE_STORY_MODULE = [{"moduleId":"EXAMPLE_STORY","rank":1,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"GREENLINE","color":"#86D826","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Great job learning about the importance of reporting bullying and supporting victims. But what if we could stop bullying before it starts? Let's step into our next mission: building a space where kindness is the rule."}]}]}},{"moduleId":"EXAMPLE_STORY","rank":2,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"GREENLINE","color":"#86D826","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Alright team, we know kindness is important. But how can we make sure everyone feels like they belong?"}]},{"name":"STUDENT","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Maybe by including everyone in activities?"}]}]}},{"moduleId":"EXAMPLE_STORY","rank":3,"template":"readonly","active":true,"readonly":{"title":"What is Inclusion?","content":[{"type":"text","value":"Inclusion means making sure everyone feels welcome and valued, regardless of their differences. It's about creating environments where all people can participate fully."}]}},{"moduleId":"EXAMPLE_STORY","rank":4,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"GREENLINE","color":"#86D826","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Exactly! Inclusion means everyone gets a seat at the table. Now, what are some ways we can practice inclusion at school?"}]}]}},{"moduleId":"EXAMPLE_STORY","rank":5,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"STUDENT","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"We could invite someone who's sitting alone to join our group!"}]},{"name":"GREENLINE","color":"#86D826","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"That's a perfect example! Small acts of inclusion can make a huge difference."}]}]}},{"moduleId":"EXAMPLE_STORY","rank":6,"template":"activity-mcq","active":true,"mcq":{"question":"What does inclusion mean?","options":[{"id":"a","value":"Only allowing certain people to join activities"},{"id":"b","value":"Making sure everyone feels welcome and can participate"},{"id":"c","value":"Choosing friends based on similarities only"},{"id":"d","value":"Keeping groups small and exclusive"}],"correctOptionId":"b"}},{"moduleId":"EXAMPLE_STORY","rank":7,"template":"activity-mcq","active":true,"mcq":{"question":"Which is an example of practicing inclusion?","options":[{"id":"a","value":"Inviting a student who sits alone to join your group"},{"id":"b","value":"Only talking to your closest friends"},{"id":"c","value":"Ignoring students who seem different"},{"id":"d","value":"Forming a club only for certain students"}],"correctOptionId":"a"}},{"moduleId":"EXAMPLE_STORY","rank":8,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"GREENLINE","color":"#86D826","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Now let's think about empathy. How do you think someone feels when they're left out?"}]}]}},{"moduleId":"EXAMPLE_STORY","rank":9,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"STUDENT","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"They might feel sad, lonely, or like they don't belong..."}]},{"name":"GREENLINE","color":"#86D826","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Exactly. That feeling of not belonging can really hurt. That's why our actions matter so much."}]}]}},{"moduleId":"EXAMPLE_STORY","rank":10,"template":"activity-flip-multi-card","active":true,"flipMultiCard":{"cards":[{"id":"1","front":"Invite someone new","back":"This shows inclusion — you're welcoming someone into the group"},{"id":"2","front":"Sit with someone alone","back":"A small act that says 'you belong here'"},{"id":"3","front":"Learn about different cultures","back":"Understanding differences builds bridges of empathy"},{"id":"4","front":"Stand up for someone being excluded","back":"This is inclusion in action — being an upstander"}]}},{"moduleId":"EXAMPLE_STORY","rank":11,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"GREENLINE","color":"#86D826","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"You're building real skills for a kinder world. Let's do a final check — what's the most powerful thing about inclusion?"}]}]}},{"moduleId":"EXAMPLE_STORY","rank":12,"template":"activity-character-feedback","active":true,"characterFeedbackActivity":{"message":"Outstanding work! You've learned how inclusion and empathy can transform any environment. Every time you include someone, you make the world a little better. You're a true kindness champion!"}}];

// EXAMPLE 2: Balanced arc module (conversation + MCQ + feedback, tight structure)
// Source: FLEC206 — 24 tasks, finance domain
export const EXAMPLE_BALANCED_MODULE = [{"moduleId":"EXAMPLE_BALANCED","rank":1,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"RAY","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Max, I was thinking where we can buy mutual funds?"}]},{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[]}]}},{"moduleId":"EXAMPLE_BALANCED","rank":2,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"RAY","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[]},{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Great question Ray! You can buy mutual funds through several channels. Let me explain the main options!"}]}]}},{"moduleId":"EXAMPLE_BALANCED","rank":3,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"RAY","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"What are the main options?"}]},{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"There are three main ways: directly through AMC websites, through online platforms/apps, or through financial advisors and banks."}]}]}},{"moduleId":"EXAMPLE_BALANCED","rank":4,"template":"readonly","active":true,"readonly":{"title":"Ways to Buy Mutual Funds","content":[{"type":"text","value":"1. Direct Plans via AMC Website: Buy directly from the fund house website. Lower expense ratio, no distributor involved.\n2. Online Platforms & Apps: Platforms like Zerodha, Groww, Paytm Money make investing easy and accessible.\n3. Through Banks or Advisors: Relationship managers can guide you, but expense ratio may be higher (regular plan)."}]}},{"moduleId":"EXAMPLE_BALANCED","rank":5,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"RAY","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Which option is cheapest?"}]},{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Direct plans are the cheapest! Since you skip the middleman, the expense ratio is lower — meaning more of your money stays invested."}]}]}},{"moduleId":"EXAMPLE_BALANCED","rank":6,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"RAY","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Do I need a lot of money to start?"}]},{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Not at all! You can start a SIP (Systematic Investment Plan) with as little as ₹500 per month. Small amounts, invested consistently, grow significantly over time."}]}]}},{"moduleId":"EXAMPLE_BALANCED","rank":7,"template":"activity-mcq","active":true,"mcq":{"question":"Which method of buying mutual funds typically has the lowest expense ratio?","options":[{"id":"a","value":"Through a bank relationship manager"},{"id":"b","value":"Through a financial advisor"},{"id":"c","value":"Direct plan via AMC website"},{"id":"d","value":"Through a broker"}],"correctOptionId":"c"}},{"moduleId":"EXAMPLE_BALANCED","rank":8,"template":"activity-mcq","active":true,"mcq":{"question":"What is the minimum amount typically needed to start a SIP?","options":[{"id":"a","value":"₹5,000 per month"},{"id":"b","value":"₹500 per month"},{"id":"c","value":"₹10,000 per month"},{"id":"d","value":"₹2,000 per month"}],"correctOptionId":"b"}},{"moduleId":"EXAMPLE_BALANCED","rank":9,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Now let's talk about KYC — Know Your Customer. Before investing, every investor must complete KYC verification. It's a one-time process."}]}]}},{"moduleId":"EXAMPLE_BALANCED","rank":10,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"RAY","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"What documents do I need for KYC?"}]},{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"You'll need your PAN card, Aadhaar card, a selfie, and bank account details. Most platforms now offer video KYC — you can complete it from your phone!"}]}]}},{"moduleId":"EXAMPLE_BALANCED","rank":11,"template":"activity-fill-blanks","active":true,"fillBlanks":{"sentence":"You can start a SIP with as little as ₹___ per month, and KYC verification requires your ___ card and Aadhaar.","blanks":[{"id":"b1","answer":"500"},{"id":"b2","answer":"PAN"}],"options":["500","PAN","1000","Voter ID","250","Passport"]}},{"moduleId":"EXAMPLE_BALANCED","rank":12,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Here's something important: always track your investments! Use apps or the AMC website to monitor your portfolio's performance. Set goals and review every 6 months."}]}]}},{"moduleId":"EXAMPLE_BALANCED","rank":13,"template":"activity-mcq","active":true,"mcq":{"question":"KYC stands for:","options":[{"id":"a","value":"Keep Your Cash"},{"id":"b","value":"Know Your Customer"},{"id":"c","value":"Key Yield Calculation"},{"id":"d","value":"Kite Yield Combination"}],"correctOptionId":"b"}},{"moduleId":"EXAMPLE_BALANCED","rank":14,"template":"activity-character-feedback","active":true,"characterFeedbackActivity":{"message":"Excellent work! You now know exactly how to buy mutual funds, why direct plans save money, and how to complete KYC. You're ready to take your first real step into investing!"}}];

// EXAMPLE 3: Non-finance domain (YouTube/creator domain) — shows generalization
// Source: YTL10301 — 12 tasks
export const EXAMPLE_DOMAIN_MODULE = [{"moduleId":"EXAMPLE_DOMAIN","rank":1,"template":"readonly","active":true,"readonly":{"title":"Building Your YouTube Channel","content":[{"type":"text","value":"A successful YouTube channel needs three things: consistent content, a recognizable identity, and an engaged audience. Today we explore how to build all three."}]}},{"moduleId":"EXAMPLE_DOMAIN","rank":2,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"RAY","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"My channel is 3 months old but I'm not getting many subscribers. What am I doing wrong?"}]},{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"The first thing I'd check is consistency. Are you posting on a regular schedule? YouTube's algorithm rewards channels that publish predictably."}]}]}},{"moduleId":"EXAMPLE_DOMAIN","rank":3,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"RAY","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"I post whenever I feel like it..."}]},{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"That's the issue! Viewers are like plants — they need regular watering. When you post randomly, viewers don't know when to expect your content. Pick a schedule: once a week is great to start."}]}]}},{"moduleId":"EXAMPLE_DOMAIN","rank":4,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Next is your channel identity. What makes YOUR channel different from the million others on the same topic?"}]},{"name":"RAY","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"I'm not sure I have a clear answer to that..."}]}]}},{"moduleId":"EXAMPLE_DOMAIN","rank":5,"template":"readonly","active":true,"readonly":{"title":"Your Channel Identity = Niche + Voice + Style","content":[{"type":"text","value":"Niche: The specific topic you cover (not just 'gaming' — 'indie horror games for beginners')\nVoice: How you speak — funny, informative, high-energy, calm?\nStyle: Your visual look — thumbnails, colors, intro style"}]}},{"moduleId":"EXAMPLE_DOMAIN","rank":6,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Here's an exercise: complete this sentence — 'My channel is for ___ who want to ___.' The more specific your answer, the clearer your identity."}]}]}},{"moduleId":"EXAMPLE_DOMAIN","rank":7,"template":"activity-mcq","active":true,"mcq":{"question":"Which niche is most likely to grow a dedicated audience?","options":[{"id":"a","value":"General gaming"},{"id":"b","value":"Technology"},{"id":"c","value":"Budget cooking for college students"},{"id":"d","value":"Lifestyle vlogs"}],"correctOptionId":"c"}},{"moduleId":"EXAMPLE_DOMAIN","rank":8,"template":"activity-reorder","active":true,"reorder":{"items":[{"id":"1","value":"Choose your specific niche"},{"id":"2","value":"Set a consistent posting schedule"},{"id":"3","value":"Design your channel banner and logo"},{"id":"4","value":"Create your first 3 videos"},{"id":"5","value":"Engage with every comment in your first month"}],"correctOrder":["1","2","3","4","5"]}},{"moduleId":"EXAMPLE_DOMAIN","rank":9,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"RAY","color":"#E85146","type":"animation","activeAnimation":"right_loop","idleAnimation":"right_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"How important is engaging with comments?"}]},{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Hugely important early on! When you reply to every comment, viewers feel seen. They come back. They tell friends. Your first 100 subscribers should feel like a community, not an audience."}]}]}},{"moduleId":"EXAMPLE_DOMAIN","rank":10,"template":"activity-mcq","active":true,"mcq":{"question":"What is the best posting frequency for a new YouTube channel?","options":[{"id":"a","value":"Post every day no matter what"},{"id":"b","value":"Post only when you have a great idea"},{"id":"c","value":"Once a week on a consistent day"},{"id":"d","value":"Twice a day for the first month"}],"correctOptionId":"c"}},{"moduleId":"EXAMPLE_DOMAIN","rank":11,"template":"activity-conversation","active":true,"conversation":{"characters":[{"name":"MAX","color":"#2CC3BF","type":"animation","activeAnimation":"left_loop","idleAnimation":"left_idle","animations":[{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}],"dialogues":[{"type":"text","value":"Remember this: every big YouTuber started with zero subscribers. MrBeast posted for 5 years before breaking through. The creators who win are the ones who don't quit."}]}]}},{"moduleId":"EXAMPLE_DOMAIN","rank":12,"template":"activity-character-feedback","active":true,"characterFeedbackActivity":{"message":"You've unlocked the three pillars of a successful channel: consistency, identity, and community. Now you have the blueprint — go build something the world hasn't seen yet!"}}];
```

---

## lib/courseGenerator/systemPrompts.ts

```typescript
import {
  EXAMPLE_STORY_MODULE,
  EXAMPLE_BALANCED_MODULE,
  EXAMPLE_DOMAIN_MODULE
} from './exampleModules';

export const BLUEPRINT_SYSTEM_PROMPT = `You are a world-class curriculum designer for BrightChamps, a live learning platform for kids aged 8–18.

You design short, engaging interactive courses of 7–8 modules. Each module teaches exactly ONE concept through story, dialogue, and activities.

GOLDEN ARC (every module must follow this structure):
1. HOOK (1-2 tasks): conversation or readonly that grabs attention
2. EXPLORE (4-6 tasks): back-and-forth dialogue building understanding
3. INTERACT (1-2 tasks): hands-on activity (mcq, fill-blanks, reorder, flip-card, table, etc.)
4. REINFORCE (2-3 tasks): MCQ questions testing the concept
5. CELEBRATE (1 task): character-feedback task, always last

ACTIVITY TYPES available (use variety across the 7-8 modules):
- activity-mcq: multiple choice question
- activity-fill-blanks: fill in the blank sentence
- activity-reorder: drag items into correct order
- activity-flip-multi-card: flip cards with front/back content
- activity-table: structured table of information
- activity-bucketing: sort items into categories
- activity-linking: match pairs

TONE GUIDELINES:
- fun: character uses humor, pop culture refs, emojis in dialogue
- adventurous: story has stakes, discoveries, missions
- serious: professional tone, real-world applications
- calm: patient, step-by-step, reassuring

You must return ONLY valid JSON. No preamble, no explanation, no markdown.`;

export const CHARACTER_SYSTEM_PROMPT = `You design memorable characters and immersive worlds for educational courses.

The character must feel like a REAL personality — not a generic tutor. They have opinions, quirks, a speaking style.

The world must feel like a place the student genuinely enters — with visual atmosphere, recurring elements, and story momentum.

You must return ONLY valid JSON. No preamble, no explanation, no markdown.`;

export function buildModuleSystemPrompt(): string {
  const storyExample = JSON.stringify(EXAMPLE_STORY_MODULE);
  const balancedExample = JSON.stringify(EXAMPLE_BALANCED_MODULE);
  const domainExample = JSON.stringify(EXAMPLE_DOMAIN_MODULE);

  return `You are a lesson content writer for BrightChamps, a live learning platform for kids.

You write complete interactive lesson modules as JSON task arrays.

STUDY THESE REAL EXAMPLES — they show the exact JSON schema and style you must produce:

EXAMPLE 1 (story-driven, high conversation):
${storyExample}

EXAMPLE 2 (balanced: conversation + fill-blanks + MCQ + feedback):
${balancedExample}

EXAMPLE 3 (different domain, shows generalization):
${domainExample}

TASK SCHEMA RULES:
- Every task MUST have: moduleId, rank (1-indexed), template, active: true
- conversation tasks: characters array, each with name, color, type:"animation", activeAnimation, idleAnimation, animations array, dialogues array
- readonly tasks: readonly object with title and content array
- activity-mcq tasks: mcq object with question, options array (each {id, value}), correctOptionId
- activity-fill-blanks tasks: fillBlanks with sentence, blanks array, options array
- activity-reorder tasks: reorder with items array, correctOrder array
- activity-flip-multi-card tasks: flipMultiCard with cards array (front/back/id)
- activity-character-feedback tasks: characterFeedbackActivity with message string (ALWAYS last task)

ANIMATION VALUES for characters:
- When character is EXPLAINING: activeAnimation="left_loop", idleAnimation="left_idle"  
- When character is ASKING/CURIOUS: activeAnimation="left_loop", idleAnimation="left_idle"
- When second character speaks: activeAnimation="right_loop", idleAnimation="right_idle"
- Character animations array is always: [{"type":"json","value":"/assets/animations/max.json"},{"type":"atlas","value":"/assets/animations/max.atlas"}]

DIALOGUE RULES:
- Each conversation task should have 1-2 characters
- Each character has exactly ONE dialogue (one dialogue object in their dialogues array)
- If a character is listening (not speaking), their dialogues array is empty []
- Dialogues alternate between characters across sequential tasks — don't have the same character speak in 3 consecutive tasks
- Each dialogue must directly reference the module's concept AND the story beat/world
- Keep dialogues 1-3 sentences. No walls of text.

GOLDEN ARC per module (strictly follow):
1. Task 1-2: HOOK — conversation that sets up the concept with a question or surprise
2. Task 3-8: EXPLORE — alternating dialogue that builds understanding step by step
3. Task 9-11: INTERACT — the module's designated activity type (NOT mcq — save mcq for reinforce)
4. Task 12-14: REINFORCE — 2-3 activity-mcq tasks testing the exact concept taught
5. Task 15 (last): CELEBRATE — activity-character-feedback, enthusiastic message referencing the world

You must return ONLY a valid JSON array. No preamble, no explanation, no markdown fences.`;
}
```

---

## lib/courseGenerator/blueprintGenerator.ts

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { BLUEPRINT_SYSTEM_PROMPT } from './systemPrompts';
import type { CourseBrief, CourseBlueprint, ModuleSpec, ActivityType } from './types';

const client = new Anthropic();

const ACTIVITY_TYPES: ActivityType[] = [
  'activity-mcq',
  'activity-fill-blanks',
  'activity-reorder',
  'activity-flip-multi-card',
  'activity-table',
  'activity-bucketing',
  'activity-linking',
];

export async function generateBlueprint(brief: CourseBrief): Promise<CourseBlueprint> {
  const moduleCount = brief.moduleCount;

  const userPrompt = `Design a ${moduleCount}-module interactive course for the BrightChamps platform.

COURSE BRIEF:
- Topic: "${brief.topic}"
- Target grade: ${brief.gradeRange}
- Tone: ${brief.tone}
- Character role: ${brief.characterRole} (the character will ${brief.characterRole === 'guide' ? 'explain and lead' : brief.characterRole === 'peer' ? 'learn alongside the student' : 'challenge and provoke thinking'})
${brief.subject ? `- Subject area: ${brief.subject}` : ''}

Return this EXACT JSON structure (no extra fields, no markdown):
{
  "courseTitle": "engaging title for the full course",
  "courseSlug": "url-safe-slug-max-4-words",
  "premise": "2 sentences: why should students care about this topic RIGHT NOW?",
  "worldSetting": "where does the story take place? Be vivid and specific.",
  "learningArc": "one sentence: what transformation does the student undergo across all ${moduleCount} modules?",
  "modules": [
    {
      "moduleNumber": 1,
      "moduleId": "SLUG_01",
      "title": "module title",
      "conceptTaught": "the single concept this module teaches — be specific",
      "storyBeat": "what happens in the character's story this module (1-2 sentences)",
      "activityType": "one of: ${ACTIVITY_TYPES.join(' | ')}",
      "estimatedMinutes": 8
    }
  ]
}

Rules for modules array:
- Module 1: always starts with a HOOK module (grab attention, set up the world)
- Module ${moduleCount}: always ends with a MASTERY module (synthesis + celebration)  
- Use DIFFERENT activityType for each module — vary them across all ${moduleCount} modules
- Each conceptTaught must be distinct — no overlap between modules
- storyBeat must advance a continuous narrative thread across modules
- moduleId format: use the courseSlug prefix + zero-padded number (e.g. "INTERNET_01")`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    system: BLUEPRINT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    const blueprint = JSON.parse(clean) as CourseBlueprint;

    // Validate and fix
    if (!blueprint.modules || blueprint.modules.length < 3) {
      throw new Error('Blueprint has too few modules');
    }

    // Ensure moduleIds are set correctly
    blueprint.modules = blueprint.modules.map((m: ModuleSpec, i: number) => ({
      ...m,
      moduleId: m.moduleId || `${blueprint.courseSlug.toUpperCase()}_${String(i + 1).padStart(2, '0')}`,
    }));

    return blueprint;
  } catch (e) {
    throw new Error(`Blueprint generation failed: ${e instanceof Error ? e.message : String(e)}\nRaw: ${text.slice(0, 200)}`);
  }
}
```

---

## lib/courseGenerator/characterGenerator.ts

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { CHARACTER_SYSTEM_PROMPT } from './systemPrompts';
import type { CourseBrief, CourseBlueprint, CourseCharacterPackage } from './types';

const client = new Anthropic();

export async function generateCharacterPackage(
  brief: CourseBrief,
  blueprint: CourseBlueprint
): Promise<CourseCharacterPackage> {

  const userPrompt = `Design the character and world for this course:

COURSE: "${blueprint.courseTitle}"
PREMISE: ${blueprint.premise}
WORLD SETTING: ${blueprint.worldSetting}
TONE: ${brief.tone}
CHARACTER ROLE: ${brief.characterRole}
GRADE: ${brief.gradeRange}
LEARNING ARC: ${blueprint.learningArc}

Return this EXACT JSON (no markdown, no extra fields):
{
  "character": {
    "name": "character's first name only",
    "role": "${brief.characterRole}",
    "personality": "3 specific adjectives that define how they speak",
    "speakingStyle": "describe HOW they communicate — do they use analogies? ask questions? tell stories?",
    "catchphrase": "one signature line they say to open modules",
    "color": "#hexcode that fits their personality",
    "animationFile": "max"
  },
  "world": {
    "name": "name of the world/universe the story happens in",
    "backgroundTheme": "specific visual atmosphere for scene backgrounds",
    "recurringElement": "one object/motif that appears in every module as a metaphor",
    "openingScene": "2 sentences: how module 1 begins — what does the student see and hear first?"
  },
  "narrative": {
    "hook": "the very first line the character says to the student — make it irresistible",
    "midpointTwist": "something unexpected that happens around module 4 to re-energize the story",
    "finalPayoff": "what the student feels at the end of module ${blueprint.modules.length} — specific emotion + realization"
  }
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    system: CHARACTER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean) as CourseCharacterPackage;
  } catch (e) {
    throw new Error(`Character generation failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
```

---

## lib/courseGenerator/moduleGenerator.ts

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { buildModuleSystemPrompt } from './systemPrompts';
import type {
  CourseBrief,
  CourseBlueprint,
  CourseCharacterPackage,
  ModuleSpec,
  GeneratedModule,
  Task,
} from './types';

const client = new Anthropic();

export async function generateModule(
  brief: CourseBrief,
  blueprint: CourseBlueprint,
  characterPackage: CourseCharacterPackage,
  moduleSpec: ModuleSpec,
  onToken?: (token: string) => void
): Promise<GeneratedModule> {
  const { character, world, narrative } = characterPackage;

  // Determine student character (peer on opposite side)
  const studentName = 'STUDENT';
  const studentColor = '#E85146';

  const userPrompt = `Generate module ${moduleSpec.moduleNumber} of ${blueprint.modules.length} for this course.

COURSE: "${blueprint.courseTitle}"
GRADE: ${brief.gradeRange} | TONE: ${brief.tone}

CONCEPT TO TEACH THIS MODULE:
"${moduleSpec.conceptTaught}"

STORY BEAT THIS MODULE:
"${moduleSpec.storyBeat}"

CHARACTER (the ${character.role}):
- Name: ${character.name}
- Personality: ${character.personality}
- Speaking style: ${character.speakingStyle}
- Catchphrase: "${character.catchphrase}"
- Color: ${character.color}
- Role in story: ${character.role === 'peer' ? `learning alongside STUDENT (${studentName})` : character.role === 'guide' ? `guiding ${studentName} through the ${world.name}` : `challenging ${studentName} to think deeper`}

WORLD CONTEXT:
- World: ${world.name}
- Visual atmosphere: ${world.backgroundTheme}
- Recurring element (use in dialogue): ${world.recurringElement}
${moduleSpec.moduleNumber === 1 ? `- Opening scene: ${world.openingScene}\n- Hook line: "${narrative.hook}"` : ''}
${moduleSpec.moduleNumber === Math.ceil(blueprint.modules.length / 2) ? `- Midpoint twist this module: ${narrative.midpointTwist}` : ''}
${moduleSpec.moduleNumber === blueprint.modules.length ? `- Final payoff: ${narrative.finalPayoff}` : ''}

ACTIVITY TYPE FOR THIS MODULE: ${moduleSpec.activityType}
(Use this as the INTERACT phase activity — tasks 9-11)

MODULE ID: ${moduleSpec.moduleId}

Generate exactly 15-18 tasks following the Golden Arc:
- Tasks 1-2: HOOK conversation
- Tasks 3-8: EXPLORE dialogues (alternate who speaks, reference ${world.recurringElement})
- Tasks 9-11: INTERACT (use ${moduleSpec.activityType} — make it test the exact concept taught)
- Tasks 12-14: REINFORCE (2-3 activity-mcq tasks)
- Task 15 (last): CELEBRATE (activity-character-feedback — reference the world and this module's concept)

Return ONLY the JSON array. No markdown, no explanation.`;

  // Use streaming for progress feedback
  let fullText = '';

  if (onToken) {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: buildModuleSystemPrompt(),
      messages: [{ role: 'user', content: userPrompt }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullText += event.delta.text;
        onToken(event.delta.text);
      }
    }
  } else {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: buildModuleSystemPrompt(),
      messages: [{ role: 'user', content: userPrompt }],
    });
    fullText = response.content[0].type === 'text' ? response.content[0].text : '';
  }

  try {
    const clean = fullText.replace(/```json\n?|\n?```/g, '').trim();
    const tasks = JSON.parse(clean) as Task[];

    // Validate
    if (!Array.isArray(tasks) || tasks.length < 5) {
      throw new Error(`Too few tasks generated: ${tasks.length}`);
    }

    // Ensure moduleId and ranks are correct
    const fixedTasks = tasks.map((t: Task, i: number) => ({
      ...t,
      moduleId: moduleSpec.moduleId,
      rank: i + 1,
      active: true,
    }));

    return {
      moduleId: moduleSpec.moduleId,
      title: moduleSpec.title,
      tasks: fixedTasks,
      generatedAt: new Date().toISOString(),
    };
  } catch (e) {
    throw new Error(
      `Module ${moduleSpec.moduleNumber} generation failed: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}
```

---

## lib/courseGenerator/courseOrchestrator.ts

```typescript
import { generateBlueprint } from './blueprintGenerator';
import { generateCharacterPackage } from './characterGenerator';
import { generateModule } from './moduleGenerator';
import type {
  CourseBrief,
  CourseBlueprint,
  CourseCharacterPackage,
  GeneratedModule,
  GeneratedCourse,
  GenerationProgress,
} from './types';

type ProgressCallback = (progress: GenerationProgress) => void;

export async function generateFullCourse(
  brief: CourseBrief,
  onProgress: ProgressCallback
): Promise<GeneratedCourse> {

  // Stage 2: Blueprint
  onProgress({ status: 'generating-blueprint', currentModule: -1, totalModules: 0, completedModules: [] });
  const blueprint = await generateBlueprint(brief);

  // Stage 3: Character + World
  onProgress({ status: 'generating-character', currentModule: -1, totalModules: blueprint.modules.length, completedModules: [] });
  const characterPackage = await generateCharacterPackage(brief, blueprint);

  // Stage 4: Modules (sequential — each module knows what came before)
  const completedModules: GeneratedModule[] = [];

  for (const moduleSpec of blueprint.modules) {
    onProgress({
      status: 'generating-modules',
      currentModule: moduleSpec.moduleNumber - 1,
      totalModules: blueprint.modules.length,
      completedModules: [...completedModules],
    });

    const generated = await generateModule(brief, blueprint, characterPackage, moduleSpec);
    completedModules.push(generated);

    onProgress({
      status: 'generating-modules',
      currentModule: moduleSpec.moduleNumber,
      totalModules: blueprint.modules.length,
      completedModules: [...completedModules],
    });
  }

  onProgress({
    status: 'complete',
    currentModule: blueprint.modules.length,
    totalModules: blueprint.modules.length,
    completedModules,
  });

  return {
    brief,
    blueprint,
    characterPackage,
    modules: completedModules,
    generatedAt: new Date().toISOString(),
  };
}
```

---

## API Routes

### app/api/generate/blueprint/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateBlueprint } from '@/lib/courseGenerator/blueprintGenerator';
import type { CourseBrief } from '@/lib/courseGenerator/types';

export async function POST(req: NextRequest) {
  try {
    const brief: CourseBrief = await req.json();
    const blueprint = await generateBlueprint(brief);
    return NextResponse.json(blueprint);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Blueprint generation failed' },
      { status: 500 }
    );
  }
}
```

### app/api/generate/character/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateCharacterPackage } from '@/lib/courseGenerator/characterGenerator';
import type { CourseBrief, CourseBlueprint } from '@/lib/courseGenerator/types';

export async function POST(req: NextRequest) {
  try {
    const { brief, blueprint }: { brief: CourseBrief; blueprint: CourseBlueprint } = await req.json();
    const characterPackage = await generateCharacterPackage(brief, blueprint);
    return NextResponse.json(characterPackage);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Character generation failed' },
      { status: 500 }
    );
  }
}
```

### app/api/generate/module/route.ts (streaming)

```typescript
import { NextRequest } from 'next/server';
import { generateModule } from '@/lib/courseGenerator/moduleGenerator';
import type { CourseBrief, CourseBlueprint, CourseCharacterPackage, ModuleSpec } from '@/lib/courseGenerator/types';

export async function POST(req: NextRequest) {
  const { brief, blueprint, characterPackage, moduleSpec }: {
    brief: CourseBrief;
    blueprint: CourseBlueprint;
    characterPackage: CourseCharacterPackage;
    moduleSpec: ModuleSpec;
  } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let buffer = '';

        const module = await generateModule(
          brief, blueprint, characterPackage, moduleSpec,
          (token) => {
            buffer += token;
            controller.enqueue(encoder.encode(token));
          }
        );

        // Send completion marker with full parsed module
        controller.enqueue(
          encoder.encode(`\n__DONE__${JSON.stringify(module)}`)
        );
        controller.close();
      } catch (e) {
        controller.enqueue(
          encoder.encode(`\n__ERROR__${e instanceof Error ? e.message : 'Module generation failed'}`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

---

## lib/courseStore.ts (Zustand)

```typescript
import { create } from 'zustand';
import type {
  CourseBrief,
  CourseBlueprint,
  CourseCharacterPackage,
  GeneratedModule,
  GenerationProgress,
  GeneratedCourse,
} from './courseGenerator/types';

interface CourseState {
  // Input
  brief: CourseBrief | null;
  setBrief: (brief: CourseBrief) => void;

  // Generation outputs
  blueprint: CourseBlueprint | null;
  characterPackage: CourseCharacterPackage | null;
  modules: GeneratedModule[];
  progress: GenerationProgress;

  // Setters
  setBlueprint: (blueprint: CourseBlueprint) => void;
  setCharacterPackage: (pkg: CourseCharacterPackage) => void;
  addModule: (module: GeneratedModule) => void;
  setProgress: (progress: GenerationProgress) => void;
  updateModuleTitle: (moduleId: string, title: string) => void;
  reorderModules: (fromIndex: number, toIndex: number) => void;

  // Export
  buildExportZip: () => Promise<Blob>;
  reset: () => void;
}

const initialProgress: GenerationProgress = {
  status: 'idle',
  currentModule: -1,
  totalModules: 0,
  completedModules: [],
};

export const useCourseStore = create<CourseState>((set, get) => ({
  brief: null,
  blueprint: null,
  characterPackage: null,
  modules: [],
  progress: initialProgress,

  setBrief: (brief) => set({ brief }),
  setBlueprint: (blueprint) => set({ blueprint }),
  setCharacterPackage: (characterPackage) => set({ characterPackage }),
  addModule: (module) => set((state) => ({ modules: [...state.modules, module] })),
  setProgress: (progress) => set({ progress }),

  updateModuleTitle: (moduleId, title) =>
    set((state) => ({
      blueprint: state.blueprint
        ? {
            ...state.blueprint,
            modules: state.blueprint.modules.map((m) =>
              m.moduleId === moduleId ? { ...m, title } : m
            ),
          }
        : null,
    })),

  reorderModules: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.blueprint) return {};
      const mods = [...state.blueprint.modules];
      const [moved] = mods.splice(fromIndex, 1);
      mods.splice(toIndex, 0, moved);
      return {
        blueprint: {
          ...state.blueprint,
          modules: mods.map((m, i) => ({ ...m, moduleNumber: i + 1 })),
        },
      };
    }),

  buildExportZip: async () => {
    const { brief, blueprint, characterPackage, modules } = get();
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const folder = zip.folder('course-export')!;

    modules.forEach((mod) => {
      folder.file(`${mod.moduleId}.json`, JSON.stringify(mod.tasks, null, 2));
    });

    folder.file('course-manifest.json', JSON.stringify({
      courseTitle: blueprint?.courseTitle,
      courseSlug: blueprint?.courseSlug,
      modules: modules.map((m) => ({
        moduleId: m.moduleId,
        title: m.title,
        taskCount: m.tasks.length,
      })),
      character: characterPackage?.character,
      world: characterPackage?.world,
      generatedAt: new Date().toISOString(),
    }, null, 2));

    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  },

  reset: () =>
    set({
      brief: null,
      blueprint: null,
      characterPackage: null,
      modules: [],
      progress: initialProgress,
    }),
}));
```

---

## Wizard Screen Specs

### S1_Brief.tsx — Course Brief (replaces S1_Audience)
No API call. Pure form. Teacher fills in:
- **Topic** (text input, placeholder: "How the Internet Works")
- **Grade** (pill selector: K-2 / 3-5 / 6-8 / 9-12)
- **Tone** (4 cards with icon: 🎮 Fun / 🚀 Adventurous / 📚 Serious / 🌿 Calm)
- **Character Role** (3 cards: Guide / Peer / Mentor — with 1-line description)
- **Module Count** (pill: 5 / 7 / 8 / 10)

Continue button unlocks when topic.length >= 4 AND grade selected.
All state → `useCourseStore.setBrief()`.

### S2_Blueprint.tsx — Blueprint Review
- Calls `POST /api/generate/blueprint` on mount (if blueprint not yet set)
- Shows skeleton loading cards while generating
- On success: display 7-8 draggable module cards
  - Each card: number badge | title (editable inline on click) | concept chip | activity type chip | time estimate
  - Drag handle on left, reorder updates store
- Bottom: course title (editable) + premise text
- Character/world teaser: just the worldSetting text, styled as a cinematic caption
- Continue unlocks when blueprint loaded

### S3_WorldCharacter.tsx — Character & World
- Calls `POST /api/generate/character` on mount (if characterPackage not yet set)
- Left panel (40%): SpineCanvas showing Max animating in `left_loop`
  - Character name overlay at bottom
  - Personality chips: 3 adjective pills
  - Catchphrase in italic quote style
- Right panel (60%): World info
  - World name as large display text
  - Background theme description
  - Recurring element with a metaphor explanation
  - Opening scene as a "Scene 1" screenplay-style card
- Continue unlocks when characterPackage loaded

### S4_Generating.tsx — Module Generation
This is the most important screen. Make it feel alive.

Layout:
- Left (30%): module list — all 7-8 modules stacked
  - Each module: status icon (⏳ pending → ⚡ generating → ✅ done) + title
  - Currently generating module pulses
- Center (70%): active generation display
  - SpineCanvas with Max doing `left_loop` animation while generating
  - Streaming text: show the raw JSON tokens as they arrive in a monospace dark terminal-style box (scroll to bottom auto)
  - When a module completes: terminal clears, module card on left turns green with a pop animation, Max does `right_loop` (celebrate), then next module starts

Call flow:
1. On mount, call modules sequentially:
   ```
   for each moduleSpec in blueprint.modules:
     POST /api/generate/module (streaming)
     stream tokens → terminal display
     on __DONE__: parse module, addModule to store, advance
   ```
2. When ALL done: auto-advance to S5

### S5_CoursePreview.tsx — Course Preview
- Left panel: module navigation (accordion or list)
- Center: task viewer — scroll through all tasks
  - Each task rendered as a mini card matching its template type
  - Conversation tasks: speech bubbles
  - MCQ tasks: option pills
  - Activity tasks: activity type badge + content preview
- Right panel (collapsible): quality check
  - Task count per module
  - Golden Arc compliance check
  - Export ready indicator

### S6_Export.tsx — Export
- Course summary stats
- Two export buttons:
  - "Download ZIP" → `courseStore.buildExportZip()` → save file
  - "Copy Course JSON" → clipboard
- CMS import instructions accordion

---

## WizardShell.tsx Changes

Update step config:
```typescript
const STEPS = [
  { id: 0, label: 'Welcome',    emoji: '✨' },
  { id: 1, label: 'Brief',      emoji: '📝' },
  { id: 2, label: 'Blueprint',  emoji: '🗺️' },
  { id: 3, label: 'Character',  emoji: '🎭' },
  { id: 4, label: 'Generate',   emoji: '⚡' },
  { id: 5, label: 'Preview',    emoji: '👁️' },
  { id: 6, label: 'Export',     emoji: '📦' },
];
```

Replace screen routing to use new screens.
ProgressRail: 7 dots.

---

## package.json additions needed

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.20.0",
    "jszip": "^3.10.1"
  }
}
```

Also add to `.env.local`:
```
ANTHROPIC_API_KEY=your_key_here
```

---

## Verification Checklist

After completing this step, verify:

```
[ ] TypeScript: 0 errors (npx tsc --noEmit)
[ ] Next.js build: clean
[ ] POST /api/generate/blueprint returns valid CourseBlueprint JSON
[ ] POST /api/generate/character returns valid CourseCharacterPackage JSON
[ ] POST /api/generate/module streams tokens then sends __DONE__ marker
[ ] S1_Brief: Continue unlocks only when topic + grade filled
[ ] S2_Blueprint: shows skeleton while loading, module cards render on success
[ ] S3_WorldCharacter: SpineCanvas shows Max, character name and catchphrase visible
[ ] S4_Generating: streaming terminal shows JSON tokens, module cards update live
[ ] S5_CoursePreview: can navigate between modules, tasks render
[ ] S6_Export: ZIP downloads with one JSON file per module
[ ] useCourseStore: brief, blueprint, characterPackage, modules all persist across navigation
[ ] No Spine names in any UI text
[ ] All screens use --bg:#1C1917 dark shell, --canvas:#F5F0E8 only in content areas
[ ] ANTHROPIC_API_KEY read from process.env (never hardcoded)
```

---

## Important Architecture Notes

1. **Module generation is SEQUENTIAL, not parallel.** Later modules should feel like they continue the story — sequential generation lets us (in future) pass previous module summaries as context.

2. **The exampleModules.ts examples are read-only ground truth.** Never modify them. They are the few-shot schema teachers for Claude.

3. **S4_Generating streams to the terminal for teacher transparency.** It's intentional — seeing the JSON build in real time builds trust and feels magical.

4. **All API routes use `claude-sonnet-4-5` not claude-3-haiku.** Quality over speed for course content. A teacher waits 60-90 seconds once — that's fine.

5. **courseStore replaces lessonStore for course generation.** The old lessonStore can remain for the original lesson wizard flow — don't delete it.
