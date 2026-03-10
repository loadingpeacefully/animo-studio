import { NextRequest, NextResponse } from 'next/server'
import { generateCharacterPackage } from '@/lib/courseGenerator/characterGenerator'
import type { CourseBrief, CourseBlueprint } from '@/lib/courseGenerator/types'

export async function POST(req: NextRequest) {
  try {
    const { brief, blueprint }: { brief: CourseBrief; blueprint: CourseBlueprint } = await req.json()
    const characterPackage = await generateCharacterPackage(brief, blueprint)
    return NextResponse.json(characterPackage)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Character generation failed' },
      { status: 500 }
    )
  }
}
