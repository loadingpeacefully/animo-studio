import { NextRequest } from 'next/server'
import { generateModule } from '@/lib/courseGenerator/moduleGenerator'
import type { CourseBrief, CourseBlueprint, CourseCharacterPackage, ModuleSpec } from '@/lib/courseGenerator/types'

export async function POST(req: NextRequest) {
  const { brief, blueprint, characterPackage, moduleSpec }: {
    brief: CourseBrief
    blueprint: CourseBlueprint
    characterPackage: CourseCharacterPackage
    moduleSpec: ModuleSpec
  } = await req.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generatedModule = await generateModule(
          brief, blueprint, characterPackage, moduleSpec,
          (token) => {
            controller.enqueue(encoder.encode(token))
          }
        )

        // Send completion marker with full parsed module for client to addModule
        controller.enqueue(encoder.encode(`\n__DONE__${JSON.stringify(generatedModule)}`))
        controller.close()
      } catch (e) {
        controller.enqueue(
          encoder.encode(`\n__ERROR__${e instanceof Error ? e.message : 'Module generation failed'}`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
