import { generateBlueprint } from './blueprintGenerator'
import { generateCharacterPackage } from './characterGenerator'
import { generateModule } from './moduleGenerator'
import type {
  CourseBrief,
  CourseBlueprint,
  CourseCharacterPackage,
  GeneratedModule,
  GeneratedCourse,
  GenerationProgress,
} from './types'

type ProgressCallback = (progress: GenerationProgress) => void

export async function generateFullCourse(
  brief: CourseBrief,
  onProgress: ProgressCallback
): Promise<GeneratedCourse> {
  // Stage 2: Blueprint
  onProgress({ status: 'generating-blueprint', currentModule: -1, totalModules: 0, completedModules: [] })
  const blueprint = await generateBlueprint(brief)

  // Stage 3: Character + World
  onProgress({ status: 'generating-character', currentModule: -1, totalModules: blueprint.modules.length, completedModules: [] })
  const characterPackage = await generateCharacterPackage(brief, blueprint)

  // Stage 4: Modules (sequential — each module knows what came before)
  const completedModules: GeneratedModule[] = []

  for (const moduleSpec of blueprint.modules) {
    onProgress({
      status: 'generating-modules',
      currentModule: moduleSpec.moduleNumber - 1,
      totalModules: blueprint.modules.length,
      completedModules: [...completedModules],
    })

    const generated = await generateModule(brief, blueprint, characterPackage, moduleSpec)
    completedModules.push(generated)

    onProgress({
      status: 'generating-modules',
      currentModule: moduleSpec.moduleNumber,
      totalModules: blueprint.modules.length,
      completedModules: [...completedModules],
    })
  }

  onProgress({
    status: 'complete',
    currentModule: blueprint.modules.length,
    totalModules: blueprint.modules.length,
    completedModules,
  })

  return {
    brief,
    blueprint,
    characterPackage,
    modules: completedModules,
    generatedAt: new Date().toISOString(),
  }
}
