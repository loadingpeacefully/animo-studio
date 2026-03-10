import Anthropic from '@anthropic-ai/sdk'
import { CHARACTER_SYSTEM_PROMPT } from './systemPrompts'
import type { CourseBrief, CourseBlueprint, CourseCharacterPackage } from './types'

const client = new Anthropic()

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
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: CHARACTER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(clean) as CourseCharacterPackage
  } catch (e) {
    throw new Error(`Character generation failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}
