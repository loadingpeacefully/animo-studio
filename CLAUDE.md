# Animo Studio — Claude Code Session Memory
**Last Updated:** Phase 1 Steps 1–2 complete | Read fully before every session.

---

## What This Project Is

Animo Studio is a **2D animated educational lesson creation platform** for teachers and content creators. It is built as a **next-generation authoring tool** on top of the patterns established by the BrightChamps learning platform (documented in `current-app-cms/`).

The key insight from studying the existing platform: the most engaging lessons combine **character-led conversations** (`activity-conversation`) with **interactive activities** (MCQ, card-flip, labelling, reorder) in a deliberate rhythm. Animo Studio makes this pattern accessible to any teacher without technical skills.

**Users:** Teachers, ed-tech content creators, curriculum designers.
**Not for:** Students, animators, developers.
**Minimum viewport:** 1280px desktop. Not mobile.

---

## Current Build Phase

```
Phase 1 — IN PROGRESS
  [✅] Step 1: Project scaffold + design system
  [✅] Step 2: Character module (Spine base64 + SpineCanvas)
  [ ] Step 3: Studio workspace (ScriptEditor + CharacterStage)
  [ ] Step 4: Voiceover + Timeline
  [ ] Step 5: Review + Export + Lessons dashboard

Phase 2 — PLANNED
  [ ] AI scene tagging via Claude API
  [ ] Training data pipeline (2000+ lesson JSONs)
  [ ] Additional characters beyond Max
  [ ] LMS export (SCORM, Google Classroom)
  [ ] Localization pipeline
```

Update checklist with ✅ as each step completes.

---

## Tech Stack (Do Not Change Without Asking)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14, App Router, TypeScript |
| Styling | Tailwind CSS + custom CSS variables |
| Animation | @esotericsoftware/spine-player@4.1 |
| State | Zustand |
| Export | JSZip |
| Audio | Web Audio API + MediaRecorder |
| Fonts | DM Sans (body) + Instrument Serif (display) |

The **existing BrightChamps app** (documented in `current-app-cms/`) uses React 18 + Redux + Vite. Animo Studio is a separate Next.js tool — do NOT attempt to port or inherit from that codebase. Use it only as a reference for JSON task formats and activity patterns.

---

## Design System (Never Deviate)

```css
--bg: #F7F4EF          /* warm off-white canvas */
--sidebar: #1A1714     /* near-black dark sidebar */
--sidebar-inner: #231F1C
--sidebar-border: #2A2420
--panel: #FFFFFF
--accent: #E8623A      /* primary orange CTA */
--accent-hover: #d4542f
--accent2: #3ABDE8     /* timeline / info blue */
--text: #1A1714
--muted: #8A8580
--border: #E8E4DE
--hover: #F0EDE8
--green: #4CAF7D       /* active/live status */
```

Fonts: `'DM Sans'` body, `'Instrument Serif'` for logo/display only.
NEVER use: Inter, Roboto, Arial, system-ui as primary fonts.
NEVER use: purple gradients, generic SaaS blue (#3B82F6), white sidebars.

---

## Project File Structure

```
/app
  /page.tsx                       ← Landing page
  /studio/page.tsx                ← Main workspace (new lesson)
  /studio/[lessonId]/page.tsx     ← Specific lesson editor
  /library/page.tsx               ← Character + scene library
  /lessons/page.tsx               ← Saved lessons dashboard
  /export/[lessonId]/page.tsx     ← Export configuration

/components
  /spine/SpineCanvas.tsx          ← Spine 4.1 player wrapper
  /studio/ScriptEditor.tsx
  /studio/CharacterStage.tsx
  /studio/AnimationMapper.tsx
  /studio/VoiceoverPanel.tsx
  /studio/Timeline.tsx
  /studio/ReviewPanel.tsx
  /studio/ExportCenter.tsx
  /lessons/LessonCard.tsx
  /ui/                            ← Shared UI primitives

/lib
  /characters/max.ts              ← Base64 encoded Spine assets
  /characters/index.ts            ← CHARACTER_REGISTRY
  /animationStates.ts             ← tag → Spine animation mapping
  /lessonStore.ts                 ← Zustand store
  /types.ts                       ← All TypeScript interfaces
  /trainingData/
    /patternAnalyzer.ts           ← Parse lesson JSONs for patterns
    /templateCatalog.ts           ← All known task template definitions

/reference                        ← READ ONLY. Source of truth.
  /json-lessons/                  ← Lesson JSON training data (grows to 2000+)
    data_8.json ... data_17.json  ← Current batch (10 lessons)
  VISUAL_REFERENCE.md
  LESSON_SCHEMA.md
  ANIMATION_STATES.md
  JSON_LESSON_PATTERNS.md         ← Extracted patterns from training JSONs
  TASK_TEMPLATE_CATALOG.md        ← All 40+ task template specs
  TRAINING_DATA_GUIDE.md          ← How to use 2000+ JSONs for AI generation

/current-app-cms                  ← READ ONLY. Existing platform architecture.
  MAIN_APP_ARCHITECTURE.md        ← Full student app architecture
  CMS_ARCHITECTURE.md             ← CMS tool architecture
```

---

## Understanding the Lesson JSON Format

The lesson JSONs in `reference/json-lessons/` are the **single most important training resource** for generating high-quality lessons. Every task is an object with:

```typescript
{
  moduleId: string          // e.g. "FINX001", "YTL10101"
  rank: number              // task order (1, 2, 3...)
  template: string          // determines which component renders this task
  templateOptions: { styles: {...} }   // background, sizing overrides
  active: boolean
  id: string

  // Template-specific data (only the relevant one is present):
  content?: ReadOnlyContent           // for "readonly" template
  conversation?: ConversationTask     // for "activity-conversation"
  mcq?: McqTask                       // for "activity-mcq"
  cardFlipGame?: CardFlipGame         // for "activity-card-flip-game"
  characterFeedbackActivity?: CharacterFeedback  // for "activity-character-feedback"
  // ...etc for each template type
}
```

### Template Frequency (from training data)

| Template | Usage | Purpose |
|----------|-------|---------|
| `activity-conversation` | ~55% of tasks | Character-led narrative, dialogue |
| `readonly` | ~25% of tasks | Content display, transitions |
| `activity-mcq` | ~12% of tasks | Assessment questions |
| `activity-character-feedback` | ~3% of tasks | Lesson-end emotion feedback |
| `activity-card-flip-game` | ~2% of tasks | Memory/matching games |
| `activity-table` | ~1% | Structured data display |
| `activity-reorder` | ~1% | Sequencing tasks |
| Others | <1% each | labelling, hotspot, guess-word, riddle, etc. |

### The Golden Lesson Arc (from pattern analysis)

Across all 10+ training modules, the most effective lesson structure is:

```
1. HOOK (readonly or conversation) — Establish story/context
2. EXPLORE (conversation chain 3-6 tasks) — Character explains with dialogue
3. INTERACT (activity: MCQ / card-flip / labelling) — Student does something
4. REFLECT (conversation 2-3 tasks) — Character reacts to learning
5. REINFORCE (readonly + MCQ cluster 2-4 tasks) — Test knowledge
6. CLOSE (character-feedback) — Emotional check-in
```

This arc is what the AI scene tagger should generate when given a topic.

### Character Structure in JSON

Characters in `activity-conversation` tasks follow this shape:
```json
{
  "type": "animation",
  "activeAnimation": "asking",     // animation when speaking
  "idleAnimation": "idle",         // animation when listening
  "characterStyle": { "height": "100%", "width": "100%" },
  "animations": [
    { "type": "json", "value": "/assets/animations/greenline.json" },
    { "type": "atlas", "value": "/assets/animations/greenline.atlas" }
  ],
  "name": "Greenline",
  "color": "#477916",
  "dialogues": [
    { "type": "text", "value": "Welcome little explorers!..." }
  ]
}
```

In Animo Studio, `Max` replaces "Greenline" as the default character. The animation paths resolve to our base64-embedded assets via rawDataURIs.

---

## Animation State Mapping (Source of Truth)

| Scene Tag  | Teacher Label | Spine Animation | JSON Equivalent       |
|------------|---------------|-----------------|-----------------------|
| explain    | Explaining    | left_idle       | idleAnimation: "idle" |
| think      | Thinking      | left_loop       | activeAnimation: "asking" |
| surprise   | Surprised     | right_idle      | varies                |
| celebrate  | Celebrating   | right_loop      | varies                |
| question   | Asking        | left_loop       | activeAnimation: "asking" |
| transition | Moving On     | right_idle      | varies                |

---

## Lesson Status State Machine

```
draft → review → approved → published
```

- No skipping allowed. Enforced in `lessonStore.ts`, not UI.
- Cannot reach `approved` unless ALL scenes have `approved: true`.
- Logic lives in `advanceStatus()` action only.

---

## Rules (Enforced Every Session — Read Before Coding)

1. **NEVER expose Spine terminology in teacher UI.** "left_idle", "animationState", "rawDataURIs" — none of these appear in labels, tooltips, or buttons. Use: Explaining, Thinking, Celebrating.

2. **NEVER build placeholder sections.** Every panel functional or clearly badged "Phase 2". No lorem ipsum. No empty boxes.

3. **NEVER deviate from the warm aesthetic.** Check CSS vars before adding any color not in the palette.

4. **NEVER initialize Spine from external URLs.** Always rawDataURIs with base64.

5. **NEVER skip lesson status states.** draft → review → approved → published only.

6. **NEVER add mobile breakpoints that break studio layout.** 1280px min.

7. **NEVER make AI API calls without loading state + error fallback.** Scene tagging degrades to rule-based.

8. **NEVER ignore the training JSON patterns.** When generating lesson structures, the Golden Lesson Arc (hook → explore → interact → reflect → reinforce → close) must be respected. This is the proven engagement pattern from real lesson data.

---

## Known Gotchas

- Spine CSS must be imported: `@esotericsoftware/spine-player/dist/spine-player.css`
- Atlas references `max.png` by filename — rawDataURIs key must match exactly
- SpinePlayer must init in useEffect — no SSR. Add `'use client'` to any component touching Spine or Web Audio
- JSZip: use `generateAsync({type:'blob'})` then `URL.createObjectURL()` for download
- MediaRecorder: check `navigator.mediaDevices` before rendering recorder UI
- Training JSONs use `/assets/...` paths for images — these will 404 in our app. All character assets must resolve through rawDataURIs or our own CDN

---

## Training Data Pipeline (Phase 2 Prep)

The `reference/json-lessons/` folder currently has 10 lessons. It will grow to 2000+. The training data pipeline in `/lib/trainingData/` should:

1. **Parse** all JSONs and extract: template sequences, dialogue lengths, activity placement patterns, character interaction styles
2. **Index** patterns by: subject area, grade level, lesson length, engagement type
3. **Inform** the AI scene tagger: when given a topic + grade, suggest a template sequence based on the closest matching training examples
4. **Never hardcode** patterns from training data into component logic — keep pattern data in the `/lib/trainingData/` layer, queryable at runtime

See `reference/TRAINING_DATA_GUIDE.md` for full implementation spec.

---

## Custom Commands

- `/new-character` — Scaffold a new character
- `/new-lesson` — Create pre-scaffolded 5-scene lesson
- `/localize` — Duplicate lesson for new language
- `/analyze-training-data` — Run pattern analysis on json-lessons folder
