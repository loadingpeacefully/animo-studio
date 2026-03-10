#!/usr/bin/env node
// Template catalog generator — reads all lesson JSONs and builds a catalog of
// every template's field usage with real examples.
//
// Used by: ScriptEditor template picker to show realistic previews.
// Run: npx tsx lib/trainingData/templateCatalog.ts

import * as fs from 'fs'
import * as path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateCatalogEntry {
  templateName: string
  frequency: number
  percentageOfTotal: number
  exampleTasks: unknown[]           // up to 3 real examples from training data
  requiredFields: string[]
  optionalFields: string[]
  teacherLabel: string              // how we show this in the Animo Studio UI
  teacherDescription: string
  animoSceneTag: string             // which SceneTag this maps to
  grouping: 'narrative' | 'activity' | 'game' | 'close'
}

interface TemplateCatalog {
  generatedAt: string
  totalTasks: number
  entries: TemplateCatalogEntry[]
}

// ─── Metadata for each known template ────────────────────────────────────────

const TEMPLATE_META: Record<string, Pick<
  TemplateCatalogEntry,
  'teacherLabel' | 'teacherDescription' | 'animoSceneTag' | 'grouping'
>> = {
  'activity-conversation':       { teacherLabel: 'Character Scene',   teacherDescription: 'Character speaks directly to the student.',       animoSceneTag: 'explain',    grouping: 'narrative' },
  'readonly':                    { teacherLabel: 'Info Slide',         teacherDescription: 'Display text, images, or infographics.',          animoSceneTag: 'transition', grouping: 'narrative' },
  'activity-mcq':                { teacherLabel: 'Question',           teacherDescription: 'Multiple choice question with scored answer.',    animoSceneTag: 'question',   grouping: 'activity' },
  'activity-character-feedback': { teacherLabel: 'How was it?',        teacherDescription: 'Emotional check-in — always the last scene.',    animoSceneTag: 'celebrate',  grouping: 'close' },
  'activity-card-flip-game':     { teacherLabel: 'Card Match',         teacherDescription: 'Memory matching game — flip pairs to find them.', animoSceneTag: 'celebrate',  grouping: 'game' },
  'activity-table':              { teacherLabel: 'Compare Table',      teacherDescription: 'Structured data comparison in a grid.',          animoSceneTag: 'explain',    grouping: 'activity' },
  'activity-reorder':            { teacherLabel: 'Put in Order',       teacherDescription: 'Drag items into the correct sequence.',          animoSceneTag: 'think',      grouping: 'activity' },
  'activity-labelling':          { teacherLabel: 'Label It',           teacherDescription: 'Drag labels onto a diagram.',                    animoSceneTag: 'think',      grouping: 'activity' },
  'activity-hotspot':            { teacherLabel: 'Click to Find',      teacherDescription: 'Click on the correct area of an image.',        animoSceneTag: 'question',   grouping: 'activity' },
  'activity-riddle':             { teacherLabel: 'Riddle',             teacherDescription: 'Pose a riddle — reveal the answer after.',       animoSceneTag: 'surprise',   grouping: 'game' },
  'activity-bucketing':          { teacherLabel: 'Sort Items',         teacherDescription: 'Drag items into the right categories.',          animoSceneTag: 'think',      grouping: 'activity' },
  'activity-guess-word':         { teacherLabel: 'Guess the Word',     teacherDescription: 'Letter-by-letter word guessing game.',           animoSceneTag: 'surprise',   grouping: 'game' },
  'activity-mcq-quiz-test':      { teacherLabel: 'Scored Quiz',        teacherDescription: 'Timed, scored test — used as final assessment.', animoSceneTag: 'question',   grouping: 'activity' },
}

// ─── Field extraction ─────────────────────────────────────────────────────────

function extractFields(tasks: unknown[]): { required: string[]; optional: string[] } {
  const fieldCounts: Record<string, number> = {}
  const total = tasks.length

  for (const task of tasks) {
    const keys = Object.keys(task as Record<string, unknown>)
    for (const key of keys) {
      fieldCounts[key] = (fieldCounts[key] ?? 0) + 1
    }
  }

  const required: string[] = []
  const optional: string[] = []

  for (const [field, count] of Object.entries(fieldCounts)) {
    if (count / total >= 0.9) required.push(field)
    else optional.push(field)
  }

  return { required: required.sort(), optional: optional.sort() }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function buildTemplateCatalog(lessonsDir: string): TemplateCatalog {
  const files = fs.readdirSync(lessonsDir)
    .filter(f =>
      f.endsWith('.json') &&
      f !== 'patterns-index.json' &&
      f !== 'metadata.json' &&
      f !== 'template-catalog.json'
    )

  const allTasks: unknown[] = []

  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(lessonsDir, f), 'utf-8')
      const parsed = JSON.parse(raw)
      const tasks = Array.isArray(parsed) ? parsed : parsed.tasks ?? []
      allTasks.push(...tasks)
    } catch {
      // skip malformed files
    }
  }

  // Group tasks by template
  const byTemplate: Record<string, unknown[]> = {}
  for (const task of allTasks) {
    const t = (task as { template?: string }).template ?? 'unknown'
    if (!byTemplate[t]) byTemplate[t] = []
    byTemplate[t].push(task)
  }

  const total = allTasks.length

  const entries: TemplateCatalogEntry[] = Object.entries(byTemplate)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([templateName, tasks]) => {
      const { required, optional } = extractFields(tasks)
      const meta = TEMPLATE_META[templateName]

      return {
        templateName,
        frequency: tasks.length,
        percentageOfTotal: Math.round((tasks.length / total) * 1000) / 10,
        exampleTasks: tasks.slice(0, 3),
        requiredFields: required,
        optionalFields: optional,
        teacherLabel: meta?.teacherLabel ?? templateName,
        teacherDescription: meta?.teacherDescription ?? '',
        animoSceneTag: meta?.animoSceneTag ?? 'explain',
        grouping: meta?.grouping ?? 'activity',
      }
    })

  return {
    generatedAt: new Date().toISOString(),
    totalTasks: total,
    entries,
  }
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

if (require.main === module || process.argv[1]?.includes('templateCatalog')) {
  const projectRoot = path.resolve(__dirname, '../../..')
  const lessonsDir = path.join(projectRoot, 'reference', 'json-lessons')

  if (!fs.existsSync(lessonsDir)) {
    console.error(`✗ Lessons directory not found: ${lessonsDir}`)
    process.exit(1)
  }

  console.log('▶ Building template catalog...')

  try {
    const catalog = buildTemplateCatalog(lessonsDir)

    const outPath = path.join(lessonsDir, 'template-catalog.json')
    fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2))
    console.log(`  ✓ Wrote template-catalog.json`)
    console.log(`  ${catalog.entries.length} templates found across ${catalog.totalTasks} tasks`)

    console.log('\n  Top templates:')
    catalog.entries.slice(0, 5).forEach(e => {
      console.log(`    ${e.templateName}: ${e.frequency} (${e.percentageOfTotal}%)`)
    })
  } catch (err) {
    console.error('✗ Catalog build failed:', err)
    process.exit(1)
  }
}
