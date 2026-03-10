import { NextRequest, NextResponse } from 'next/server'
import { generateBlueprint } from '@/lib/courseGenerator/blueprintGenerator'
import type { CourseBrief } from '@/lib/courseGenerator/types'

export async function POST(req: NextRequest) {
  try {
    const brief: CourseBrief = await req.json()
    const blueprint = await generateBlueprint(brief)
    return NextResponse.json(blueprint)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Blueprint generation failed' },
      { status: 500 }
    )
  }
}
