# Task Template Catalog

All task templates observed in training data + documented in BrightChamps platform.
This is the complete vocabulary of what a lesson can contain.
Use this when building the ScriptEditor template picker and lesson generator.

---

## How Templates Map to Animo Studio

| Platform Template | Animo Studio Equivalent | Scene Tag |
|-------------------|------------------------|-----------|
| `activity-conversation` | Character dialogue scene | explain / think / question |
| `readonly` | Content card / info slide | explain / transition |
| `activity-mcq` | Multiple choice question | question (scored) |
| `activity-character-feedback` | Emotion check-in | celebrate |
| `activity-card-flip-game` | Memory match game | celebrate (game) |
| `activity-table` | Data comparison | explain |
| `activity-reorder` | Sequence ordering | think |
| `activity-labelling` | Diagram labelling | think |
| `activity-hotspot` | Click-on-image | question |
| `activity-riddle` | Riddle card | surprise |
| `activity-bucketing` | Category sorting | think |
| `activity-guess-word` | Word puzzle | surprise (game) |

---

## Template Specifications

---

### `readonly`
**Purpose:** Display rich content without interaction. Used for hooks, infographics, transitions, summaries.

```typescript
interface ReadOnlyTask {
  content: {
    sections: ContentSection[]  // array of text, image, text-heading items
    actions: ActionButton[]     // navigation buttons (Let's Go, Start, Continue)
  }
  templateOptions: {
    styles: { backgroundImage?: string }
  }
}
```

**Content section types:**
- `{ type: "text-heading", value: string, style?: {...} }` — Large heading
- `{ type: "text", value: string, style?: {...} }` — Body text
- `{ type: "image", value: string, style?: {...} }` — Image
- `{ type: "text-medium", value: string }` — Medium weight text

**Animo Studio usage:** Info slide, concept intro, lesson hook, transition between blocks.

---

### `activity-conversation`
**Purpose:** Character-led dialogue advancing the lesson narrative. Most used template (55%).

```typescript
interface ConversationTask {
  conversation: {
    background: string          // background image URL
    foreground?: string         // foreground layer URL
    actions: ActionButton[]     // next/prev navigation
    characters: ConversationCharacter[]
  }
}

interface ConversationCharacter {
  type: "animation"
  activeAnimation: string       // animation when speaking
  idleAnimation: string         // animation when not speaking
  characterStyle: CSSProperties
  animations: [
    { type: "json", value: string },
    { type: "atlas", value: string }
  ]
  name: string
  color: string                 // speech bubble accent color
  url?: string                  // fallback static image
  dialogues: Array<{ type: "text", value: string }>
}
```

**Animo Studio usage:** Teach with Max speaking. 1 or 2 characters. Background from preset library.

---

### `activity-mcq`
**Purpose:** Multiple choice question with scored options. Assessment.

```typescript
interface McqTask {
  mcq: {
    question: {
      id: number
      contents: ContentSection[]   // question text/image
    }
    options: McqOption[]
    multiSelect?: boolean         // allow multiple correct answers
    showCheckBox?: boolean        // default false (custom styling)
    containerStyle?: CSSProperties
    templateAudio?: {
      correctAudio: { sources: string[] }
      incorrectAudio: { sources: string[] }
    }
  }
}

interface McqOption {
  id: number
  isCorrect: boolean
  contents: ContentSection[]      // option display (text or image)
  style: CSSProperties            // default state
  selectedStyle: CSSProperties    // when selected
  inCorrectStyle: CSSProperties   // when wrong answer shown
  correctStyle?: CSSProperties    // when right answer shown
}
```

**Animo Studio usage:** Assessment questions. The ScriptEditor places these after explanation scenes automatically per the Golden Arc.

---

### `activity-character-feedback`
**Purpose:** Emotional check-in with character. Always last task in a module.

```typescript
interface CharacterFeedbackTask {
  characterFeedbackActivity: {
    title: ContentSection[]           // "How did you feel about..."
    type: "option-button"
    multiSelect: boolean              // always false
    optionsFlow: "horizontal"
    options: FeedbackOption[]
    actions: ActionButton[]
    tagLabel: string                  // analytics tag e.g. "feedback_module_end_FINX001"
    animateStyles?: string            // "top-bottom" entrance animation
    stepStyle?: CSSProperties
    characters: ConversationCharacter[] // Greenline/teacher asking
  }
}

interface FeedbackOption {
  id: number
  score: 1 | 3 | 5                  // 5=positive, 3=neutral, 1=negative
  content: ContentSection[]         // emoji + label
  goToStep: string                  // always "step3" for positive, "step4" for negative
}
```

**Animo Studio usage:** Auto-added as final task of every lesson. Score feeds analytics.

---

### `activity-card-flip-game`
**Purpose:** Memory matching game. Flip cards to find pairs.

```typescript
interface CardFlipGame {
  cardFlipGame: {
    question: ContentSection[]      // instructions text
    cards: FlipCard[]               // must be even count, pairs share same `code`
  }
}

interface FlipCard {
  code: number                      // matching pair identifier (two cards = same code)
  backSections: ContentSection[]    // what's revealed when flipped
  backCardStyle: CSSProperties      // card back background color
}
```

**Pairs rule:** Cards come in pairs sharing the same `code`. One card shows text, the matching card shows an image. Player flips to find the text-image match.

**Animo Studio usage:** Game activity. Use for vocabulary matching, concept-definition pairs, fact-image matching.

---

### `activity-table`
**Purpose:** Present structured comparison data in grid format.

```typescript
interface TableTask {
  table: {
    headers: ContentSection[][]     // column headers
    rows: ContentSection[][][]      // row data (array of arrays)
    style?: CSSProperties
    headerStyle?: CSSProperties
  }
}
```

**Animo Studio usage:** Comparing concepts side by side. Budget tables, pros/cons, data analysis.

---

### `activity-reorder`
**Purpose:** Student drags items into correct sequence.

```typescript
interface ReorderTask {
  reorder: {
    question: ContentSection[]
    items: ReorderItem[]
    correctOrder: number[]          // correct sequence of item IDs
  }
}

interface ReorderItem {
  id: number
  contents: ContentSection[]
  style?: CSSProperties
}
```

**Animo Studio usage:** Sequencing tasks — steps of a process, timeline events, cause→effect chains.

---

### `activity-labelling`
**Purpose:** Place labels on an image diagram.

```typescript
interface LabellingTask {
  labelling: {
    image: { value: string, style?: CSSProperties }
    labels: LabelItem[]
    dropZones: DropZone[]
  }
}

interface LabelItem {
  id: number
  contents: ContentSection[]
}

interface DropZone {
  id: number
  correctLabelId: number
  position: { top: string, left: string }   // % positioning on image
}
```

**Animo Studio usage:** Diagram annotation — body parts, map labels, product components.

---

### `activity-hotspot`
**Purpose:** Click on specific areas of an image to answer.

```typescript
interface HotspotTask {
  hotspot: {
    image: { value: string, style?: CSSProperties }
    question: ContentSection[]
    hotspots: Hotspot[]
  }
}

interface Hotspot {
  id: number
  isCorrect: boolean
  position: { top: string, left: string, width: string, height: string }
  feedback?: ContentSection[]       // shown after selection
}
```

**Animo Studio usage:** "Click on the correct item in the image" tasks.

---

### `activity-riddle`
**Purpose:** Present a riddle; student must guess before reveal.

```typescript
interface RiddleTask {
  riddle: {
    question: ContentSection[]      // the riddle text
    answer: ContentSection[]        // revealed after student attempts
    hint?: ContentSection[]
    style?: CSSProperties
  }
}
```

**Animo Studio usage:** Curiosity-building tasks. Good for introducing new concepts.

---

### `activity-bucketing`
**Purpose:** Sort items into categories (drag-and-drop categorization).

```typescript
interface BucketingTask {
  bucketing: {
    question: ContentSection[]
    items: BucketItem[]
    buckets: Bucket[]
  }
}

interface BucketItem {
  id: number
  contents: ContentSection[]
  correctBucketId: number
}

interface Bucket {
  id: number
  label: ContentSection[]
  style?: CSSProperties
}
```

**Animo Studio usage:** Sorting concepts into groups — needs vs wants, assets vs liabilities.

---

### `activity-guess-word`
**Purpose:** Letter-by-letter word guessing game (Hangman-style or fill-in).

```typescript
interface GuessWordTask {
  guessWord: {
    word: string                    // the word to guess
    hint: ContentSection[]          // clue shown to student
    maxAttempts?: number
  }
}
```

**Animo Studio usage:** Vocabulary games. Good for spelling/terminology reinforcement.

---

### `activity-pick-items`
**Purpose:** Select multiple items from a displayed collection.

```typescript
interface PickItemsTask {
  pickItems: {
    question: ContentSection[]
    items: PickItem[]
    minSelect: number
    maxSelect: number
  }
}

interface PickItem {
  id: number
  isCorrect: boolean
  contents: ContentSection[]
}
```

**Animo Studio usage:** "Pick all the items that belong to category X" tasks.

---

### `activity-input`
**Purpose:** Free text entry (subjective/open-ended).

```typescript
interface InputTask {
  input: {
    question: ContentSection[]
    placeholder?: string
    validation?: {
      minLength?: number
      maxLength?: number
      pattern?: string
    }
    solution?: ContentSection[]     // shown after submission
  }
}
```

**Animo Studio usage:** Reflection prompts, journal entries, open-ended responses.

---

### `activity-mcq-quiz-test`
**Purpose:** Timed scored quiz. Used at end of YTL modules as final test.

```typescript
interface McqQuizTestTask {
  mcqQuizTest: {
    questions: McqQuestion[]
    timeLimit?: number              // seconds
    passingScore?: number           // percentage
    showResults: boolean
  }
}
```

**Animo Studio usage:** Formal assessment. Maps to Review → Approved flow in Animo Studio.

---

## Content Section Types (Universal)

Used in all templates:

```typescript
type ContentSectionType =
  | "text"            // body text
  | "text-heading"    // large heading
  | "text-medium"     // medium weight
  | "text-small"      // caption
  | "image"           // image URL
  | "audio"           // audio URL
  | "video"           // video URL
  | "animation"       // Spine animation reference

interface ContentSection {
  type: ContentSectionType
  value: string
  style?: CSSProperties
  contentStyle?: CSSProperties
  additionalProps?: Record<string, any>
}
```

---

## Action Button Types (Universal)

```typescript
interface ActionButton {
  id: number
  variant: "primary" | "secondary" | "icon" | "text"
  contents: ContentSection[]
  style?: CSSProperties
  goToStep?: string               // conditional navigation
}
```

---

## Animo Studio Template Picker UI

In the ScriptEditor, teachers can insert templates. Show them grouped:

**Narrative**
- 💬 Character Scene → `activity-conversation`
- 📄 Info Slide → `readonly`

**Activities**
- ✅ Question → `activity-mcq`
- 🃏 Card Match → `activity-card-flip-game`
- 🔀 Put in Order → `activity-reorder`
- 🏷️ Label It → `activity-labelling`
- 📊 Compare Table → `activity-table`
- 🗑️ Sort Items → `activity-bucketing`
- 🖱️ Click to Find → `activity-hotspot`

**Games**
- 🎯 Riddle → `activity-riddle`
- 🔤 Guess the Word → `activity-guess-word`

**Close**
- ⭐ How was it? → `activity-character-feedback`

Phase 2 (locked in UI):
- 💻 Code Challenge → `activity-code`
- 📝 Written Answer → `activity-input`
