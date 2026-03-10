import { create } from 'zustand'
import type {
  CourseBrief,
  CourseBlueprint,
  CourseCharacterPackage,
  GeneratedModule,
  GenerationProgress,
} from './courseGenerator/types'

interface CourseState {
  // Input
  brief: CourseBrief | null
  setBrief: (brief: CourseBrief) => void

  // Generation outputs
  blueprint: CourseBlueprint | null
  characterPackage: CourseCharacterPackage | null
  modules: GeneratedModule[]
  progress: GenerationProgress

  // Setters
  setBlueprint: (blueprint: CourseBlueprint) => void
  setCharacterPackage: (pkg: CourseCharacterPackage) => void
  addModule: (module: GeneratedModule) => void
  setProgress: (progress: GenerationProgress) => void
  updateModuleTitle: (moduleId: string, title: string) => void
  reorderModules: (fromIndex: number, toIndex: number) => void

  // Export
  buildExportZip: () => Promise<Blob>
  reset: () => void
}

const initialProgress: GenerationProgress = {
  status: 'idle',
  currentModule: -1,
  totalModules: 0,
  completedModules: [],
}

export const useCourseStore = create<CourseState>((set, get) => ({
  brief:            null,
  blueprint:        null,
  characterPackage: null,
  modules:          [],
  progress:         initialProgress,

  setBrief:            (brief)            => set({ brief }),
  setBlueprint:        (blueprint)        => set({ blueprint }),
  setCharacterPackage: (characterPackage) => set({ characterPackage }),
  addModule:           (module)           => set((state) => ({ modules: [...state.modules, module] })),
  setProgress:         (progress)         => set({ progress }),

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
      if (!state.blueprint) return {}
      const mods = [...state.blueprint.modules]
      const [moved] = mods.splice(fromIndex, 1)
      mods.splice(toIndex, 0, moved)
      return {
        blueprint: {
          ...state.blueprint,
          modules: mods.map((m, i) => ({ ...m, moduleNumber: i + 1 })),
        },
      }
    }),

  buildExportZip: async () => {
    const { brief, blueprint, characterPackage, modules } = get()
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const folder = zip.folder('course-export')!

    modules.forEach((mod) => {
      folder.file(`${mod.moduleId}.json`, JSON.stringify(mod.tasks, null, 2))
    })

    folder.file('course-manifest.json', JSON.stringify({
      courseTitle:  blueprint?.courseTitle,
      courseSlug:   blueprint?.courseSlug,
      modules:      modules.map((m) => ({
        moduleId:   m.moduleId,
        title:      m.title,
        taskCount:  m.tasks.length,
      })),
      character:    characterPackage?.character,
      world:        characterPackage?.world,
      generatedAt:  new Date().toISOString(),
    }, null, 2))

    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  },

  reset: () =>
    set({
      brief:            null,
      blueprint:        null,
      characterPackage: null,
      modules:          [],
      progress:         initialProgress,
    }),
}))
