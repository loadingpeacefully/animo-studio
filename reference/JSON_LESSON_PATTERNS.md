# JSON Lesson Patterns — Extracted from Training Data

This file documents patterns extracted from the lesson JSONs in `json-lessons/`.
When AI scene generation is implemented, it should use these patterns.
When adding 2000+ more JSONs, re-run analysis and update this file.

---

## Modules Analyzed (Current Batch)

| File | Module ID | Tasks | Course |
|------|-----------|-------|--------|
| data_8.json | FINX101 | 40 | Financial Literacy |
| data_9.json | FINX102 | 26 | Financial Literacy |
| data_10.json | FINX103 | 4 | Financial Literacy (revision) |
| data_11.json | FINX001 | 49 | Financial Literacy (intro) |
| data_12.json | FINX201 | 34 | Financial Literacy Advanced |
| data_13.json | FINX202 | 28 | Financial Literacy Advanced |
| data_14.json | FINX203 | 35 | Financial Literacy Advanced |
| data_15.json | YTL10101 | 34 | Young Tycoons |
| data_16.json | YTL10201 | 35 | Young Tycoons |
| data_17.json | YTL10301 | 34 | Young Tycoons |

**Total tasks analyzed: 319 across 10 modules**

---

## Template Distribution

```
activity-conversation      175 tasks  (54.9%)
readonly                    81 tasks  (25.4%)
activity-mcq                44 tasks  (13.8%)
activity-character-feedback  8 tasks   (2.5%)
activity-table               6 tasks   (1.9%)
activity-reorder             5 tasks   (1.6%)
activity-card-flip-game      2 tasks   (0.6%)
activity-labelling           2 tasks   (0.6%)
activity-hotspot             1 task    (0.3%)
activity-guess-word          1 task    (0.3%)
activity-input               1 task    (0.3%)
activity-riddle              3 tasks   (0.9%)
activity-bucketing           2 tasks   (0.6%)
activity-pick-items          1 task    (0.3%)
activity-mcq-tiles           1 task    (0.3%)
activity-mcq-feedback        1 task    (0.3%)
activity-mcq-quiz-test       3 tasks   (0.9%)
activity-typeform            3 tasks   (0.9%)
activity-feedback-form       1 task    (0.3%)
```

---

## The Golden Lesson Arc

Pattern observed consistently across all 10 modules:

### Standard Module Arc (~30-40 tasks)
```
Position 1-3:    HOOK
                 → conversation (character introduces world/scenario)
                 → readonly (set the scene visually)

Position 4-12:   EXPLORE BLOCK 1
                 → conversation chain (3-6 tasks, character explains concept A)
                 → 1 interactive break (MCQ or labelling)
                 → conversation (character reacts, moves story forward)

Position 13-20:  EXPLORE BLOCK 2
                 → readonly (new concept introduced via infographic)
                 → conversation chain (character builds on concept)
                 → 1 interactive activity (different type from block 1)

Position 21-28:  REINFORCE
                 → readonly (summary infographic)
                 → MCQ cluster (3-6 questions, same background)
                 → character-feedback (mid-lesson emotional check)

Position 29-35:  DEEPEN
                 → conversation (character takes story further)
                 → specialized activity (reorder, table, card-flip)
                 → readonly (key takeaway)

Position 36-40:  ASSESS & CLOSE
                 → MCQ cluster (4-6 final questions)
                 → character-feedback (end-of-lesson emotion rating)
```

### Short Module Arc (~4-5 tasks, e.g. FINX103)
```
Position 1:   readonly (intro/hook)
Position 2:   activity (single game — card-flip-game, riddle)
Position 3:   readonly (bridge/next step)
Position 4:   character-feedback (end)
```

---

## Conversation Task Patterns

### Average dialogue length
- Opening task: 40-80 words per character dialogue
- Mid-lesson conversations: 20-50 words
- Reaction dialogues (after activity): 10-30 words

### Two-character conversations
Most `activity-conversation` tasks feature **2 characters**:
- Character 1: Teacher/guide character (Greenline, etc.) — left side
- Character 2: Student/learner character (Max) — right side

The characters alternate speaking. Structure:
```json
"characters": [
  { "name": "Greenline", "activeAnimation": "asking", "idleAnimation": "idle",
    "dialogues": [{ "type": "text", "value": "Welcome!..." }] },
  { "name": "Max", "activeAnimation": "left_loop", "idleAnimation": "left_idle",
    "dialogues": [{ "type": "text", "value": "Wow, really?..." }] }
]
```

### Single-character narration
Some tasks have 1 character narrating directly to the student.
These are typically transitional tasks between concepts.

---

## Background & Visual Patterns

Every conversation task sets a scene via:
```json
"conversation": {
  "background": "/assets/modules/FINX001/image/bg-01.png",
  "foreground": "/assets/modules/FINX001/image/fg-1.png"
}
```

- Backgrounds change per scene "chapter" (same BG for 3-5 tasks, then changes)
- Foreground adds depth elements (trees, furniture, etc.)
- MCQ tasks use `templateOptions.styles.backgroundImage` for their own BG

**In Animo Studio:** Teachers select from preset background themes.
Background switching should happen at scene arc boundaries, not every task.

---

## MCQ Patterns

### Question content
- Usually 1 question per task (not batched)
- Can be image-based options (most visual) or text options
- Multi-select (`multiSelect: true`) used for "select all that apply" questions
- Each option has: `isCorrect`, `contents`, `style`, `selectedStyle`, `inCorrectStyle`

### Feedback
- Correct/incorrect audio always specified (short sound effect)
- `showCheckBox: false` is typical (custom option styling)
- Options arranged in grid (2×2 or 2×3 most common)

### MCQ Clusters
After major concepts, 3-6 MCQ tasks appear back-to-back with the same background.
This is the "reinforcement cluster" pattern. The AI should group these together
and suggest them after every major concept in the lesson.

---

## Character Feedback Task Pattern

Always appears at lesson end (and sometimes mid-lesson after difficult sections):
```json
{
  "template": "activity-character-feedback",
  "characterFeedbackActivity": {
    "title": [{ "type": "text-heading", "value": "What do you feel about the overall experience?" }],
    "type": "option-button",
    "multiSelect": false,
    "options": [
      { "id": 1, "score": 5, "content": [emoji + "It was interesting"] },
      { "id": 2, "score": 3, "content": [emoji + "Moderately interesting"] },
      { "id": 3, "score": 1, "content": [emoji + "Not interesting at all"] }
    ],
    "tagLabel": "feedback_module_end_[module]",
    "characters": [{ Greenline asking the question }]
  }
}
```

In Animo Studio, this maps to the `celebrate` scene tag with a built-in feedback form.

---

## Engagement Variety Rules (Observed)

From pattern analysis, engaging lessons follow these rules:
1. **Never 2 MCQs back-to-back** in the explore phase (only OK in reinforce clusters)
2. **Always at least 1 activity** between conversation chains longer than 6 tasks
3. **Background must change** at least once per 8 tasks
4. **Character must react** after every student activity (at least 1 conversation after MCQ)
5. **Riddles/games** (card-flip, guess-word, riddle) are placed at mid-lesson, never at the end
6. **Feedback form** always last. Character-feedback is the final task in every module.

These rules should be the basis of the lesson quality validator in ReviewPanel.

---

## Subject-Specific Patterns

### Financial Literacy (FINX series)
- Heavy use of real-world scenario-setting in opening conversations
- Characters reference "the jungle", "safari", "market" as metaphors
- MCQs are often image-based (objects to identify)
- Labelling tasks for identifying types of currency, goods, services

### Young Tycoons (YTL series)
- More table-heavy (structured data comparison)
- More reorder tasks (sequencing business steps)
- End with `activity-mcq-quiz-test` (scored test format) before feedback
- Conversations more Q&A style (student character asks, teacher answers)

---

## What This Means for Lesson Generation

When the AI generates a lesson given `{topic, subject, grade, length}`:

1. **Select arc** based on length: short (<10 tasks) or standard (25-40 tasks)
2. **Open with** conversation hook (1-2 tasks) establishing a relatable scenario
3. **Space activities** so no more than 6 consecutive conversations without interaction
4. **Match subject** to interaction type: factual subjects → MCQ, procedural subjects → reorder/table
5. **End with** character-feedback (always last)
6. **Vary backgrounds** at arc boundaries
7. **Include at least 1 game-type activity** (card-flip, riddle, guess-word) per module

---

## How to Add More Training Data

When 2000+ lesson JSONs are added to `reference/json-lessons/`:

1. Drop JSON files into the folder (naming: `data_[n].json` or `[moduleId].json`)
2. Run: `node /lib/trainingData/patternAnalyzer.ts --reindex`
3. This regenerates a `patterns-index.json` in `reference/json-lessons/`
4. Claude Code reads `patterns-index.json` when generating lesson structures
5. Update this file's statistics section with new counts

The pattern analyzer should extract:
- Template sequence fingerprints (what templates appear in what order)
- Dialogue word count distributions
- Activity type frequencies by subject/grade
- Background change intervals
- Conversation chain lengths
