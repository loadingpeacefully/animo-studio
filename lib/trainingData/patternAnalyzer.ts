#!/usr/bin/env node
// Pattern analyzer — reads all lesson JSONs in reference/json-lessons/
// and outputs patterns-index.json + metadata.json
//
// Run: npx tsx lib/trainingData/patternAnalyzer.ts
// Or:  npm run analyze-training-data

import * as fs from 'fs'
import * as path from 'path'

// ─── Output types ─────────────────────────────────────────────────────────────

interface PatternsIndex {
  generatedAt: string
  totalModules: number
  totalTasks: number
  templateFrequency: Record<string, number>
  arcPatterns: ArcPattern[]
  dialogueLengths: {
    opening: { min: number; max: number; avg: number }
    midLesson: { min: number; max: number; avg: number }
    reaction: { min: number; max: number; avg: number }
  }
  subjectProfiles: Record<string, SubjectProfile>
  qualityRules: QualityRuleMeta[]
}

interface ArcPattern {
  id: string
  name: string
  moduleIds: string[]
  templateSequence: string[]   // abbreviated: C=conversation, R=readonly, M=mcq, F=feedback, etc.
  taskCount: { min: number; max: number }
  subject: string
  gradeLevel: string
}

interface SubjectProfile {
  dominantTemplates: string[]
  averageTaskCount: number
  activityTypes: string[]
  characterCount: { min: number; max: number; avg: number }
}

interface QualityRuleMeta {
  id: string
  description: string
  severity: 'error' | 'warning'
}

// ─── Task type (minimal — we only read what we need) ──────────────────────────

interface RawTask {
  moduleId?: string
  rank?: number
  template?: string
  active?: boolean
  conversation?: {
    characters?: Array<{
      dialogues?: Array<{ type: string; value: string }>
    }>
  }
}

// ─── Template abbreviation map ────────────────────────────────────────────────

const TEMPLATE_ABBREV: Record<string, string> = {
  'activity-conversation':       'C',
  'readonly':                    'R',
  'activity-mcq':                'M',
  'activity-character-feedback': 'F',
  'activity-card-flip-game':     'G',
  'activity-table':              'T',
  'activity-reorder':            'O',
  'activity-labelling':          'L',
  'activity-hotspot':            'H',
  'activity-riddle':             'D',
  'activity-bucketing':          'B',
  'activity-guess-word':         'W',
  'activity-mcq-quiz-test':      'Q',
  'activity-typeform':           'Y',
}

function abbrev(template: string): string {
  return TEMPLATE_ABBREV[template] ?? 'X'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function mean(nums: number[]): number {
  return nums.length === 0 ? 0 : Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

function inferSubjectFromModuleId(moduleId: string): string {
  if (moduleId.startsWith('FINX')) return 'financial-literacy'
  if (moduleId.startsWith('YTL'))  return 'business'
  if (moduleId.startsWith('MATH')) return 'math'
  if (moduleId.startsWith('SCI'))  return 'science'
  return 'general'
}

// ─── Core analyzers ───────────────────────────────────────────────────────────

function countTemplates(modules: Array<{ tasks: RawTask[] }>): Record<string, number> {
  const freq: Record<string, number> = {}
  for (const { tasks } of modules) {
    for (const task of tasks) {
      const t = task.template ?? 'unknown'
      freq[t] = (freq[t] ?? 0) + 1
    }
  }
  return Object.fromEntries(
    Object.entries(freq).sort(([, a], [, b]) => b - a)
  )
}

function extractArcPatterns(modules: Array<{ filename: string; tasks: RawTask[] }>): ArcPattern[] {
  const patterns: ArcPattern[] = []

  for (const { filename, tasks } of modules) {
    if (tasks.length === 0) continue

    const moduleId = tasks[0]?.moduleId ?? path.basename(filename, '.json')
    const seq = tasks.map(t => abbrev(t.template ?? ''))
    const subject = inferSubjectFromModuleId(moduleId)

    patterns.push({
      id: moduleId,
      name: `${subject} module (${tasks.length} tasks)`,
      moduleIds: [moduleId],
      templateSequence: seq,
      taskCount: { min: tasks.length, max: tasks.length },
      subject,
      gradeLevel: 'mixed',
    })
  }

  return patterns
}

function measureDialogueLengths(modules: Array<{ tasks: RawTask[] }>) {
  const opening: number[] = []
  const midLesson: number[] = []
  const reaction: number[] = []

  for (const { tasks } of modules) {
    const convTasks = tasks.filter(t => t.template === 'activity-conversation')
    const total = convTasks.length

    convTasks.forEach((task, idx) => {
      const chars = task.conversation?.characters ?? []
      const wordCounts = chars.flatMap(c =>
        (c.dialogues ?? [])
          .filter(d => d.type === 'text')
          .map(d => countWords(d.value))
      )
      const avgWords = mean(wordCounts)
      if (avgWords === 0) return

      const position = idx / (total || 1)
      if (position < 0.15) opening.push(avgWords)
      else if (position > 0.75) reaction.push(avgWords)
      else midLesson.push(avgWords)
    })
  }

  const stats = (arr: number[]) => ({
    min: arr.length ? Math.min(...arr) : 0,
    max: arr.length ? Math.max(...arr) : 0,
    avg: mean(arr),
  })

  return {
    opening:   stats(opening),
    midLesson: stats(midLesson),
    reaction:  stats(reaction),
  }
}

function buildSubjectProfiles(modules: Array<{ tasks: RawTask[] }>): Record<string, SubjectProfile> {
  const grouped: Record<string, RawTask[][]> = {}

  for (const { tasks } of modules) {
    const mid = tasks[0]?.moduleId ?? 'unknown'
    const subject = inferSubjectFromModuleId(mid)
    if (!grouped[subject]) grouped[subject] = []
    grouped[subject].push(tasks)
  }

  const profiles: Record<string, SubjectProfile> = {}

  for (const [subject, moduleTasks] of Object.entries(grouped)) {
    const allTasks = moduleTasks.flat()
    const freq: Record<string, number> = {}
    for (const task of allTasks) {
      const t = task.template ?? 'unknown'
      freq[t] = (freq[t] ?? 0) + 1
    }

    const dominantTemplates = Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([t]) => t)

    const activityTypes = Object.keys(freq).filter(t =>
      t.startsWith('activity-') && t !== 'activity-conversation' && t !== 'activity-character-feedback'
    )

    const charCounts = moduleTasks.map(tasks =>
      new Set(
        tasks
          .filter(t => t.template === 'activity-conversation')
          .flatMap(t => (t.conversation?.characters ?? []).map(c => (c as { name?: string }).name ?? 'unknown'))
      ).size
    )

    profiles[subject] = {
      dominantTemplates,
      averageTaskCount: Math.round(moduleTasks.reduce((s, t) => s + t.length, 0) / moduleTasks.length),
      activityTypes,
      characterCount: {
        min: charCounts.length ? Math.min(...charCounts) : 1,
        max: charCounts.length ? Math.max(...charCounts) : 2,
        avg: mean(charCounts),
      },
    }
  }

  return profiles
}

// ─── Quality rules (derived from training data patterns) ─────────────────────

const QUALITY_RULES: QualityRuleMeta[] = [
  {
    id: 'Q001',
    description: 'Never more than 6 consecutive conversation/explain scenes without an activity',
    severity: 'warning',
  },
  {
    id: 'Q002',
    description: 'Lesson must end with a celebration or feedback scene',
    severity: 'error',
  },
  {
    id: 'Q003',
    description: 'At least one activity (non-conversation, non-readonly) required',
    severity: 'error',
  },
  {
    id: 'Q004',
    description: 'Minimum 3 scenes recommended for a meaningful lesson',
    severity: 'warning',
  },
  {
    id: 'Q005',
    description: 'Script text should be 10–100 words per scene',
    severity: 'warning',
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

export function analyzeAll(lessonsDir: string): PatternsIndex {
  const files = fs.readdirSync(lessonsDir)
    .filter(f =>
      f.endsWith('.json') &&
      f !== 'patterns-index.json' &&
      f !== 'metadata.json'
    )
    .sort()

  const modules = files.map(f => {
    const raw = fs.readFileSync(path.join(lessonsDir, f), 'utf-8')
    let tasks: RawTask[] = []
    try {
      const parsed = JSON.parse(raw)
      tasks = Array.isArray(parsed) ? parsed : parsed.tasks ?? []
    } catch {
      console.warn(`  ⚠ Could not parse ${f} — skipping`)
    }
    return { filename: f, tasks }
  })

  const totalTasks = modules.reduce((s, m) => s + m.tasks.length, 0)

  console.log(`  Loaded ${modules.length} modules, ${totalTasks} tasks`)

  const index: PatternsIndex = {
    generatedAt: new Date().toISOString(),
    totalModules: modules.length,
    totalTasks,
    templateFrequency: countTemplates(modules),
    arcPatterns: extractArcPatterns(modules),
    dialogueLengths: measureDialogueLengths(modules),
    subjectProfiles: buildSubjectProfiles(modules),
    qualityRules: QUALITY_RULES,
  }

  return index
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

if (require.main === module || process.argv[1]?.includes('patternAnalyzer')) {
  const projectRoot = path.resolve(__dirname, '../../..')
  const lessonsDir = path.join(projectRoot, 'reference', 'json-lessons')

  if (!fs.existsSync(lessonsDir)) {
    console.error(`✗ Lessons directory not found: ${lessonsDir}`)
    process.exit(1)
  }

  console.log('▶ Analyzing training data...')
  console.log(`  Source: ${lessonsDir}`)

  try {
    const index = analyzeAll(lessonsDir)

    const indexPath = path.join(lessonsDir, 'patterns-index.json')
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
    console.log(`  ✓ Wrote patterns-index.json (${index.totalModules} modules, ${index.totalTasks} tasks)`)

    const metadata = {
      generatedAt: index.generatedAt,
      totalModules: index.totalModules,
      totalTasks: index.totalTasks,
      topTemplates: Object.entries(index.templateFrequency)
        .slice(0, 5)
        .map(([t, n]) => `${t}: ${n}`),
    }
    fs.writeFileSync(path.join(lessonsDir, 'metadata.json'), JSON.stringify(metadata, null, 2))
    console.log('  ✓ Wrote metadata.json')
    console.log('✓ Done. Run /analyze-training-data again after adding more JSONs.')
  } catch (err) {
    console.error('✗ Analysis failed:', err)
    process.exit(1)
  }
}
