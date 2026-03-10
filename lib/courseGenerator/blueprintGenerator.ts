import Anthropic from '@anthropic-ai/sdk'
import { BLUEPRINT_SYSTEM_PROMPT } from './systemPrompts'
import type { CourseBrief, CourseBlueprint, ModuleSpec, ActivityType } from './types'

const client = new Anthropic()

const ACTIVITY_TYPES: ActivityType[] = [
  'activity-mcq',
  'activity-fill-blanks',
  'activity-reorder',
  'activity-flip-multi-card',
  'activity-table',
  'activity-bucketing',
  'activity-linking',
]

export async function generateBlueprint(brief: CourseBrief): Promise<CourseBlueprint> {
  const moduleCount = brief.moduleCount

  const slidesPerModule = brief.slidesPerModule || 15
  const estimatedMinutes = Math.round(slidesPerModule * 0.5) // ~30sec per slide

  const userPrompt = `Design a ${moduleCount}-module interactive course.

COURSE BRIEF:
- Topic: "${brief.topic}"
- Target grade: ${brief.gradeRange}
- Tone: ${brief.tone}
- Character role: ${brief.characterRole} (the character will ${brief.characterRole === 'guide' ? 'explain and lead' : brief.characterRole === 'peer' ? 'learn alongside the student' : 'challenge and provoke thinking'})
- Slides per module: ~${slidesPerModule} tasks/slides per module
${brief.subject ? `- Subject area: ${brief.subject}` : ''}

YOUR THINKING PROCESS (follow these steps):

STEP 1 — IMAGINE THE WORLD:
Before writing anything, decide: What WORLD does this course live in? Not a classroom. A vivid, specific place that makes "${brief.topic}" feel like an adventure. Think about what a ${brief.gradeRange} grader would find genuinely exciting.

STEP 2 — DESIGN THE STORY ARC:
This is a ${moduleCount}-chapter story. Module 1 is the inciting incident — something happens that pulls the student into this world. The middle modules escalate the stakes. The final module is the climax where everything comes together.

STEP 3 — MAP CONCEPTS TO CHAPTERS:
Each module teaches ONE concept. Concepts must BUILD on each other — Module 3 should require understanding Module 2. No isolated topics.

STEP 4 — ASSIGN ACTIVITIES:
Give each module a DIFFERENT activity type. The activity should naturally test that module's concept.

STEP 5 — WRITE CLIFFHANGERS:
Each module's storyBeat should end with something unresolved — a mystery, a question, a threat — that makes the student WANT to start the next module.

Return this EXACT JSON structure (no extra fields, no markdown):
{
  "courseTitle": "engaging title for the full course",
  "courseSlug": "url-safe-slug-max-4-words",
  "premise": "2 sentences: why should students care about this topic RIGHT NOW? Make it personal to a ${brief.gradeRange} grader.",
  "worldSetting": "where does the story take place? Be vivid — sights, sounds, atmosphere.",
  "learningArc": "one sentence: what transformation does the student undergo across all ${moduleCount} modules?",
  "modules": [
    {
      "moduleNumber": 1,
      "moduleId": "SLUG_01",
      "title": "module title",
      "conceptTaught": "the single concept this module teaches — be specific",
      "storyBeat": "what happens in the character's story this module (1-2 sentences, end with a hook)",
      "activityType": "one of: ${ACTIVITY_TYPES.join(' | ')}",
      "estimatedMinutes": ${estimatedMinutes}
    }
  ]
}

Rules for modules array:
- Module 1: always starts with a HOOK module (grab attention, set up the world)
- Module ${moduleCount}: always ends with a MASTERY module (synthesis + celebration)
- Use DIFFERENT activityType for each module — vary them across all ${moduleCount} modules
- Each conceptTaught must be distinct — no overlap between modules
- storyBeat must advance a continuous narrative thread across modules, each ending with a cliffhanger or unresolved question
- moduleId format: use the courseSlug prefix + zero-padded number (e.g. "INTERNET_01")`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: BLUEPRINT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    const blueprint = JSON.parse(clean) as CourseBlueprint

    if (!blueprint.modules || blueprint.modules.length < 3) {
      throw new Error('Blueprint has too few modules')
    }

    blueprint.modules = blueprint.modules.map((m: ModuleSpec, i: number) => ({
      ...m,
      moduleId: m.moduleId || `${blueprint.courseSlug.toUpperCase()}_${String(i + 1).padStart(2, '0')}`,
    }))

    return blueprint
  } catch (e) {
    throw new Error(`Blueprint generation failed: ${e instanceof Error ? e.message : String(e)}\nRaw: ${text.slice(0, 200)}`)
  }
}
