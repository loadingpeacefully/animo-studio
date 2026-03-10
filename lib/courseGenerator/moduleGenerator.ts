import Anthropic from '@anthropic-ai/sdk'
import { buildModuleSystemPrompt } from './systemPrompts'
import type {
  CourseBrief,
  CourseBlueprint,
  CourseCharacterPackage,
  ModuleSpec,
  GeneratedModule,
  Task,
} from './types'

const client = new Anthropic()

export async function generateModule(
  brief: CourseBrief,
  blueprint: CourseBlueprint,
  characterPackage: CourseCharacterPackage,
  moduleSpec: ModuleSpec,
  onToken?: (token: string) => void
): Promise<GeneratedModule> {
  const { character, world, narrative } = characterPackage

  const studentName = 'STUDENT'
  const studentColor = '#E85146'

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

Return ONLY the JSON array. No markdown, no explanation.`

  let fullText = ''

  if (onToken) {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: buildModuleSystemPrompt(),
      messages: [{ role: 'user', content: userPrompt }],
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullText += event.delta.text
        onToken(event.delta.text)
      }
    }
  } else {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: buildModuleSystemPrompt(),
      messages: [{ role: 'user', content: userPrompt }],
    })
    fullText = response.content[0].type === 'text' ? response.content[0].text : ''
  }

  try {
    const clean = fullText.replace(/```json\n?|\n?```/g, '').trim()
    const tasks = JSON.parse(clean) as Task[]

    if (!Array.isArray(tasks) || tasks.length < 5) {
      throw new Error(`Too few tasks generated: ${tasks.length}`)
    }

    const fixedTasks = tasks.map((t: Task, i: number) => ({
      ...t,
      moduleId: moduleSpec.moduleId,
      rank: i + 1,
      active: true,
    }))

    return {
      moduleId: moduleSpec.moduleId,
      title: moduleSpec.title,
      tasks: fixedTasks,
      generatedAt: new Date().toISOString(),
    }
  } catch (e) {
    throw new Error(
      `Module ${moduleSpec.moduleNumber} generation failed: ${e instanceof Error ? e.message : String(e)}`
    )
  }
}
