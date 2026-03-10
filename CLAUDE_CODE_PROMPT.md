# Claude Code Prompt — Animo Studio
# Project: interactive-learning | Repo: suneetjagdev/interactive-learning

---

## TASK

I want to build a web-based 2D animated educational lesson creation platform called **Animo Studio** so that teachers and content creators can script, animate, and publish engaging localized lessons — with zero manual animation work — and export production-ready assets in one click.

First, read these files completely before doing anything:

**Character & Animation Assets:**
- `reference/animo-studio.html` — Working prototype with Spine player, embedded max character (max.json, max.atlas, max.png). Study the rawDataURIs initialization pattern exactly.
- `reference/max.json` — Spine 4.1 skeleton: 21 bones, 24 slots, 4 animations
- `reference/max.atlas` — Texture atlas mapping sprite regions to PNG
- `reference/max.png` — Sprite sheet with all character parts

**Lesson Structure & Patterns:**
- `reference/LESSON_SCHEMA.md` — All TypeScript interfaces, Zustand store, status state machine
- `reference/ANIMATION_STATES.md` — Scene tag → Spine animation mapping, SpineCanvas component spec
- `reference/TASK_TEMPLATE_CATALOG.md` — All 40+ task template types with TypeScript interfaces
- `reference/JSON_LESSON_PATTERNS.md` — Pattern analysis from 10 real lessons: Golden Arc, template frequencies, engagement rules
- `reference/TRAINING_DATA_GUIDE.md` — How to build the training data pipeline for 2000+ lesson JSONs

**Real Lesson Examples (Training Data):**
- `reference/json-lessons/data_8.json` through `data_17.json` — 10 real BrightChamps lessons (319 tasks total). Study the structure of `activity-conversation`, `activity-mcq`, and `activity-character-feedback` tasks closely.

**Existing Platform Architecture:**
- `current-app-cms/MAIN_APP_ARCHITECTURE.md` — Full student-facing app architecture (React + Redux + Vite). Do NOT replicate this stack. Use as reference only for task JSON structure and component patterns.
- `current-app-cms/CMS_ARCHITECTURE.md` — Existing CMS architecture. Understand the task template system and content hierarchy. Animo Studio replaces this for teacher users.

**UI Design:**
- `reference/VISUAL_REFERENCE.md` — Precise text description of every UI panel (use this instead of screenshots since you can't see images)

---

## WHAT WE'RE BUILDING (Context from Architecture Docs)

The existing BrightChamps platform has a sophisticated lesson JSON format with 40+ task templates (`activity-conversation`, `activity-mcq`, `activity-card-flip-game`, etc.). The most effective lessons follow the **Golden Arc**: hook → explore (conversations) → interact (activity) → reflect → reinforce (MCQ cluster) → close (character-feedback).

Animo Studio takes this proven structure and makes it **accessible to any teacher**:
- Instead of editing raw JSON in a CMS, teachers write scripts in plain language
- Instead of manually configuring Spine animations, character reactions are automatic
- Instead of exporting manually, all production files download in one click
- Instead of requiring a content team for localization, one lesson → N languages

The lesson JSON format we output must be **compatible with the existing platform schema** so lessons created in Animo Studio can be imported into the BrightChamps CMS. See `reference/LESSON_SCHEMA.md` for the full TypeScript interfaces.

---

## SUCCESS BRIEF

**Type of output:** Full-stack Next.js 14 web application, production-grade, multi-page.

**Recipient's reaction:** A teacher opens the tool, types a lesson topic, sees Max animate reactively during preview, records their voiceover, approves all scenes, and exports — feeling like they produced a professional animated lesson without knowing anything about JSON, Spine, or animation.

**Does NOT sound like:**
- A prototype with "coming soon" placeholders
- A generic AI dashboard with purple gradients and Inter font
- Something that requires technical knowledge to operate
- A copy of the existing BrightChamps CMS — this is simpler and teacher-first

**Success means:** Teacher completes the full loop — topic → character → voiceover → preview → export — in under 15 minutes on first use. Generated lessons follow the Golden Arc pattern validated by 319 real tasks.

---

## ARCHITECTURE

### Tech Stack
- **Framework:** Next.js 14, App Router, TypeScript
- **Styling:** Tailwind CSS + CSS variables (see CLAUDE.md for palette)
- **Animation:** @esotericsoftware/spine-player@4.1 (rawDataURIs pattern from reference HTML)
- **State:** Zustand
- **Export:** JSZip
- **Audio:** Web Audio API + MediaRecorder
- **Training Data:** Node.js fs module for reading json-lessons in dev

### Pages & Routes
```
/                           → Landing page
/studio                     → Main creation workspace
/studio/[lessonId]          → Specific lesson editor
/library                    → Character library
/lessons                    → Saved lessons dashboard
/export/[lessonId]          → Export center
```

### Core Components

**1. `<ScriptEditor />`**
- Script textarea with scene break detection
- Scene tag picker using teacher-friendly labels (NOT Spine names)
- Auto-tagging using keyword rules from LESSON_SCHEMA.md
- Word count + estimated duration
- Template picker for inserting activity types (from TASK_TEMPLATE_CATALOG.md)

**2. `<CharacterStage />`**
- SpineCanvas with Max character
- Reacts to scene tag via SCENE_TAG_ANIMATIONS mapping
- Background selector (preset themes from training data backgrounds)
- Character position controls

**3. `<Timeline />`**
- Scenes as horizontal blocks showing tag color + duration
- Play/pause with keyboard shortcut (Space)
- Active scene scrubbing

**4. `<VoiceoverPanel />`**
- MediaRecorder in-browser recording
- Canvas waveform visualization
- Language selector (localization prep)

**5. `<ReviewPanel />`**
- Scene-by-scene playback
- Approve ✓ / Flag ⚑ / Comment per scene
- Quality validator warnings (from TRAINING_DATA_GUIDE.md rules)
- Status: Draft → In Review → Approved → Published

**6. `<ExportCenter />`**
- JSZip download of all Spine files
- Lesson JSON export (compatible with BrightChamps task schema)
- LMS embed code

**7. `<LessonGenerator />`** (Phase 1: rule-based)
- Takes topic + subject + grade → generates scene array
- Uses Golden Arc from JSON_LESSON_PATTERNS.md
- Falls back to manual if generation fails

### Training Data Layer (`/lib/trainingData/`)
```
patternAnalyzer.ts    ← Reads json-lessons/, outputs patterns-index.json
templateCatalog.ts    ← Maps template names to component definitions
lessonGenerator.ts    ← Rule-based lesson generation using patterns
qualityValidator.ts   ← Validates lessons against training data rules
```

---

## RULES

1. **NEVER expose Spine/animation terminology in teacher UI.** "left_idle", "animationState", "rawDataURIs" never appear in UI labels. Use: Explaining, Thinking, Celebrating.

2. **NEVER build placeholder sections.** Every panel functional or clearly badged "Phase 2". No lorem ipsum.

3. **NEVER deviate from the warm aesthetic.** Background #F7F4EF, sidebar #1A1714, accent #E8623A. DM Sans + Instrument Serif. No purple. No Inter.

4. **NEVER initialize Spine from external URLs.** Always rawDataURIs with base64. Follow the exact pattern in `reference/animo-studio.html`.

5. **NEVER allow lesson status to skip states.** draft → review → approved → published, enforced in store only.

6. **NEVER add mobile breakpoints that break studio layout.** 1280px minimum.

7. **NEVER make AI API calls without loading state + error fallback.**

8. **NEVER generate a lesson that violates the Golden Arc rules** from JSON_LESSON_PATTERNS.md. Specifically: max 6 consecutive conversation scenes without an activity, always end with character-feedback, at least 1 interactive activity per lesson.

9. **NEVER modify the JSON files in reference/json-lessons/.** They are read-only training data.

10. **ALWAYS make lesson JSON export compatible with the BrightChamps task schema** from TASK_TEMPLATE_CATALOG.md. The exported JSON should be importable by the existing CMS.

---

## CONVERSATION

Before writing any code, ask me:

1. **Lesson generator:** Rule-based Arc for Phase 1 (recommended), or should I attempt Claude API integration from day one?
2. **Character library:** Just Max now, or scaffold CHARACTER_REGISTRY slots for 3-5 even if only Max has real assets?
3. **Export format:** Spine files only, or should the exported lesson JSON also match the full BrightChamps task schema so it can be imported into their CMS?
4. **Training data pipeline:** Build the `patternAnalyzer.ts` in Phase 1 (so it's ready when 2000+ JSONs arrive), or leave it as Phase 2?

---

## PLAN

Before writing code, list the 3 most critical rules for this build, then present this execution plan and wait for approval:

**Step 1 — Scaffold**
`npx create-next-app@latest . --typescript --tailwind --app`
Install: zustand, jszip, @esotericsoftware/spine-player
Setup: folder structure, CSS variables, fonts, base layout, globals

**Step 2 — Character module**
Encode max.json + max.atlas + max.png as base64 → `/lib/characters/max.ts`
Build SpineCanvas using exact rawDataURIs pattern from animo-studio.html
Test all 4 animations render correctly

**Step 3 — Training data layer**
Build `patternAnalyzer.ts` to read json-lessons/ and output patterns-index.json
Build `qualityValidator.ts` with 5 rules from TRAINING_DATA_GUIDE.md
Build rule-based `lessonGenerator.ts` using Golden Arc

**Step 4 — Studio workspace**
Main /studio route with 3-panel layout
ScriptEditor with rule-based auto-tagger + template picker
CharacterStage wired to scene tags via SCENE_TAG_ANIMATIONS
Verify: Spine terminology never appears in UI

**Step 5 — Voiceover + Timeline**
MediaRecorder integration
Canvas waveform
Timeline with scene blocks

**Step 6 — Review + Export + Dashboard**
ReviewPanel with quality validator warnings + approve/flag/comment
Status machine enforcement
ExportCenter: JSZip Spine files + lesson JSON export
Lessons dashboard at /lessons

---

## ALIGNMENT

Only begin coding once I confirm the plan.

Complete each step fully. Show file structure after each step. Definition of done: teacher writes a 5-scene lesson, Max animates differently per scene following the Golden Arc, teacher records voiceover, approves all scenes, downloads a zip with Spine files + a lesson JSON compatible with BrightChamps CMS schema.
