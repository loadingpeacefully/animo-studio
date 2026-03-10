# How to Build Animo Studio with Claude Code
## Complete Step-by-Step Instructions (v2 — includes training data pipeline)

---

## Prerequisites

- Node.js 18+ (`node --version`)
- Claude Code installed (`npm install -g @anthropic-ai/claude-code`)
- `interactive-learning/` repo cloned from suneetjagdev/interactive-learning
- All files from this folder copied into the repo (see Step 0)

---

## Step 0 — Repo Setup

Your `interactive-learning/` repo should end up looking like this after copying:

```
interactive-learning/
  CLAUDE.md                             ← Claude Code reads this automatically
  CLAUDE_CODE_PROMPT.md                 ← First-run prompt
  INSTRUCTIONS.md                       ← This file
  
  .claude/
    settings.json
    commands/
      new-character.md
      new-lesson.md
      localize.md
      analyze-training-data.md          ← NEW

  reference/
    animo-studio.html                   ← Working prototype
    max.json / max.atlas / max.png      ← Spine character assets
    VISUAL_REFERENCE.md
    LESSON_SCHEMA.md
    ANIMATION_STATES.md
    JSON_LESSON_PATTERNS.md             ← NEW: patterns from training data
    TASK_TEMPLATE_CATALOG.md            ← NEW: all 40+ template specs
    TRAINING_DATA_GUIDE.md              ← NEW: pipeline for 2000+ JSONs
    json-lessons/                       ← NEW: training data folder
      data_8.json ... data_17.json      ← 10 real lessons (319 tasks)

  current-app-cms/                      ← NEW: existing platform docs
    MAIN_APP_ARCHITECTURE.md
    CMS_ARCHITECTURE.md
```

Copy command:
```bash
cp -r animo-studio-project-files/* interactive-learning/
```

---

## Step 1 — Start Claude Code

```bash
cd interactive-learning
claude
```

Claude Code reads `CLAUDE.md` automatically. You'll see it acknowledge the project.

---

## Step 2 — First Run Prompt

Paste this exactly:

```
Read CLAUDE_CODE_PROMPT.md completely. Then read these files in order:
1. reference/LESSON_SCHEMA.md
2. reference/JSON_LESSON_PATTERNS.md  
3. reference/TASK_TEMPLATE_CATALOG.md
4. One example lesson: reference/json-lessons/data_11.json (study the activity-conversation and activity-mcq structure)
5. current-app-cms/CMS_ARCHITECTURE.md (understand the existing task template system)

Then ask me your 4 clarifying questions. Do not write any code yet.
```

**Recommended answers:**
1. Rule-based generator for Phase 1 ← simpler, faster to ship
2. Just Max, scaffold CHARACTER_REGISTRY for growth
3. Export both Spine files AND BrightChamps-compatible lesson JSON ← more useful
4. Build patternAnalyzer.ts in Phase 1 ← it's just a Node script, low effort

---

## Step 3 — Approve the Plan

After answering, Claude Code presents the 6-step plan.
Type: `Plan approved. Begin Step 1.`

---

## Step 4 — Step 1: Project Scaffold

Claude Code runs:
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-git
npm install zustand jszip @esotericsoftware/spine-player
```

Sets up: folder structure from CLAUDE.md, CSS variables, Google Fonts, base layout.

Verify: `npm run dev` opens localhost:3000 without errors.

`Step 1 complete. Begin Step 2.`

---

## Step 5 — Step 2: Character Module

Claude Code:
- Encodes max.json → base64 string
- Reads max.atlas raw text
- Encodes max.png → base64 string
- Creates `/lib/characters/max.ts` with MAX_CHARACTER object
- Creates `/lib/characters/index.ts` with CHARACTER_REGISTRY
- Builds SpineCanvas component (exact rawDataURIs pattern from animo-studio.html)

Verify: Test page shows Max animating. All 4 animations switch correctly.
Verify: "left_idle" does NOT appear anywhere in the UI.

`Step 2 complete. Begin Step 3.`

---

## Step 6 — Step 3: Training Data Layer ← NEW

Claude Code builds `/lib/trainingData/`:

```
patternAnalyzer.ts   ← Reads json-lessons/*.json → patterns-index.json
templateCatalog.ts   ← Template name → component definition mapping
lessonGenerator.ts   ← Rule-based Golden Arc lesson generation
qualityValidator.ts  ← 5 quality rules from TRAINING_DATA_GUIDE.md
```

After building, run the analyzer:
```bash
npx ts-node lib/trainingData/patternAnalyzer.ts
```

Expected output:
```
Analyzed 10 modules, 319 tasks.
Top templates: activity-conversation (54.9%), readonly (25.4%), activity-mcq (13.8%)
Arc patterns found: 2 (standard ~35-task, short ~4-task)
Index written to reference/json-lessons/patterns-index.json
```

Verify:
1. `patterns-index.json` created in `reference/json-lessons/`
2. Lesson generator produces 5 scenes from `generateLesson({topic: 'fractions', subject: 'math', gradeLevel: '3-5', lessonLength: 'short'})`
3. Quality validator catches a broken lesson (create one with 7 consecutive "explain" scenes, confirm Q001 warning fires)

`Step 3 complete. Begin Step 4.`

---

## Step 7 — Step 4: Studio Workspace

Claude Code builds:
- `/studio` route with 3-panel layout (matches VISUAL_REFERENCE.md exactly)
- ScriptEditor with rule-based auto-tagger
- CharacterStage wired to SCENE_TAG_ANIMATIONS
- Template picker showing teacher-friendly names from TASK_TEMPLATE_CATALOG.md

Verify:
1. Layout: dark left sidebar (#1A1714), dot-grid canvas, white right panel
2. Tag a scene as "Explaining" → Max plays left_idle
3. Tag it "Celebrating" → Max plays right_loop
4. "left_idle" or any Spine term NEVER visible in the UI
5. Template picker shows "Character Scene", "Info Slide", "Question" etc (NOT raw template names)

`Step 4 complete. Begin Step 5.`

---

## Step 8 — Step 5: Voiceover + Timeline

Claude Code builds VoiceoverPanel + Timeline.

Verify:
1. Browser asks for microphone permission on record click
2. Waveform appears after recording
3. Timeline shows scenes as colored horizontal blocks
4. Scrubbing changes active scene + Max animation

`Step 5 complete. Begin Step 6.`

---

## Step 9 — Step 6: Review + Export + Dashboard

Claude Code builds ReviewPanel, ExportCenter, /lessons dashboard.

Critical things to verify:
1. Quality validator warnings appear in ReviewPanel (create a lesson that violates a rule)
2. Cannot advance to "Approved" until all scenes have `approved: true`
3. Download All produces a zip containing:
   - `max.json` (Spine skeleton)
   - `max.atlas` (texture atlas)
   - `max.png` (sprite sheet)
   - `lesson.json` (BrightChamps-compatible task array)
4. The exported `lesson.json` follows the task schema from TASK_TEMPLATE_CATALOG.md
5. /lessons shows lesson cards with correct status badges

`Step 6 complete. Phase 1 done.`

---

## Step 10 — Update CLAUDE.md

```
All 6 steps complete. Mark Phase 1 as done in CLAUDE.md. 
Add any new gotchas discovered. Update the phase checklist.
```

---

## Adding More Training Data (Anytime)

When you have more lesson JSONs to add:

```bash
# 1. Drop files into the folder:
cp your-new-lessons/*.json interactive-learning/reference/json-lessons/

# 2. Re-index in Claude Code:
/analyze-training-data
```

No code changes needed. The lesson generator picks up new patterns automatically.

---

## Using Custom Commands

```
/new-character         → Add a new Spine character to the library
/new-lesson            → Scaffold a lesson from a topic
/localize              → Duplicate an approved lesson for a new language
/analyze-training-data → Re-index json-lessons/ after adding more JSONs
```

---

## Common Issues & Fixes

**Spine player blank canvas**
→ rawDataURIs key must exactly match atlas filename (`max.png`)
→ Check atlas file line 1 references `max.png` (not a path)

**"window is not defined"**
→ Missing `'use client'` on SpineCanvas
→ Spine import must be inside useEffect or dynamic import

**Pattern analyzer crashes**
→ Check for malformed JSON in json-lessons/ — add try/catch per file
→ Ensure patterns-index.json and metadata.json are excluded from input files

**Generated lesson doesn't follow Golden Arc**
→ The lessonGenerator.ts arc templates need updating
→ Check that STANDARD_ARC constant matches JSON_LESSON_PATTERNS.md exactly

**Exported lesson JSON not CMS-compatible**
→ Check scene.tag → template mapping in ExportCenter
→ `explain` → `activity-conversation`, `question` → `activity-mcq`, `celebrate` → `activity-character-feedback`
→ Required fields: moduleId, rank, template, active, characters, prompts, dialogues

---

## Phase 2 Checklist (After Phase 1 Ships)

```
[ ] Claude API scene tagging (replace rule-based)
[ ] ElevenLabs TTS in VoiceoverPanel
[ ] 3+ additional characters in CHARACTER_REGISTRY
[ ] SCORM + Google Classroom export
[ ] Collaborative review (share link, reviewer-only access)
[ ] localStorage persistence for lessons
[ ] Full localization pipeline (/localize command)
[ ] Training data grows to 100+ JSONs → re-run /analyze-training-data
[ ] Training data grows to 2000+ JSONs → AI-assisted generation with few-shot examples
[ ] Background library from real lesson backgrounds
[ ] Activity builder (card-flip, labelling in the studio UI)
```
