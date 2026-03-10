'use client'

import { useState } from 'react'
import type { Task } from '@/lib/courseGenerator/types'

// ─── Character avatar ─────────────────────────────────────────────────────────

function CharAvatar({ name, color, size = 64 }: { name: string; color: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width:  size,
        height: size,
        background: color,
        fontSize:   size * 0.35,
        boxShadow:  `0 4px 20px ${color}40`,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ─── Conversation ──────────────────────────────────────────────────────────────

function ConversationTask({ task }: { task: Task }) {
  if (!task.conversation) return null
  const chars = task.conversation.characters
  const leftChar  = chars.find(c => c.activeAnimation?.includes('left'))
  const rightChar = chars.find(c => c.activeAnimation?.includes('right'))
  const speaker   = chars.find(c => c.dialogues?.length > 0)
  const dialogue  = speaker?.dialogues?.[0]?.value ?? ''
  const isLeft    = speaker?.activeAnimation?.includes('left')

  return (
    <div className="flex flex-col h-full" style={{ background: '#F5F0E8' }}>

      {/* Dialogue area */}
      <div className="flex-1 flex items-center justify-center px-10 py-6">
        {dialogue ? (
          <div className="relative max-w-[520px] w-full">
            {/* Bubble */}
            <div
              className="bg-white rounded-2xl px-6 py-5 text-[15px] leading-relaxed shadow-sm"
              style={{ color: '#1A1714', borderRadius: 20 }}
            >
              {dialogue}
            </div>
            {/* Tail */}
            <div
              className="absolute bottom-[-10px] w-0 h-0"
              style={{
                [isLeft ? 'left' : 'right']:  40,
                borderLeft:  '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop:   '12px solid white',
              }}
            />
          </div>
        ) : (
          <div className="text-[#8A8580] text-[13px] font-mono italic">
            (No dialogue — character is listening)
          </div>
        )}
      </div>

      {/* Characters row */}
      <div className="flex items-end justify-between px-10 pb-6" style={{ minHeight: 96 }}>
        {/* Left */}
        <div className="flex flex-col items-center gap-2">
          {leftChar && (
            <>
              <CharAvatar name={leftChar.name} color={leftChar.color} size={72} />
              <span
                className="text-[11px] font-bold font-mono uppercase tracking-wide"
                style={{ color: leftChar.color }}
              >
                {leftChar.name}
              </span>
            </>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-col items-center gap-2">
          {rightChar && (
            <>
              <CharAvatar name={rightChar.name} color={rightChar.color} size={72} />
              <span
                className="text-[11px] font-bold font-mono uppercase tracking-wide"
                style={{ color: rightChar.color }}
              >
                {rightChar.name}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Readonly ──────────────────────────────────────────────────────────────────

function ReadonlyTask({ task }: { task: Task }) {
  if (!task.readonly) return null
  const content = task.readonly.content
  const text = Array.isArray(content)
    ? content.map(c => (typeof c === 'string' ? c : c.value)).join('\n\n')
    : String(content)

  return (
    <div
      className="flex flex-col h-full overflow-y-auto px-10 py-8"
      style={{ background: '#FDFAF6' }}
    >
      {task.readonly.title && (
        <h3
          className="font-display text-[22px] font-semibold mb-4 leading-snug"
          style={{ color: '#1A1714' }}
        >
          {task.readonly.title}
        </h3>
      )}
      <div
        className="text-[14px] leading-[1.75] whitespace-pre-line"
        style={{ color: '#3A3530' }}
      >
        {text}
      </div>
    </div>
  )
}

// ─── MCQ ───────────────────────────────────────────────────────────────────────

function McqTask({ task }: { task: Task }) {
  const [selected, setSelected] = useState<string | null>(null)
  if (!task.mcq) return null
  const { question, options, correctOptionId } = task.mcq

  function getStyle(id: string) {
    if (!selected) return { bg: 'white', border: '#E8E4DE', text: '#1A1714' }
    if (id === correctOptionId) return { bg: '#E8F7EF', border: '#4CAF7D', text: '#1A1714' }
    if (id === selected) return { bg: '#FEF0EC', border: '#E8623A', text: '#1A1714' }
    return { bg: 'white', border: '#E8E4DE', text: '#8A8580' }
  }

  return (
    <div
      className="flex flex-col h-full px-10 py-8"
      style={{ background: '#F5F0E8' }}
    >
      <p className="text-[17px] font-semibold leading-snug mb-6" style={{ color: '#1A1714' }}>
        {question}
      </p>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {options.map(opt => {
          const s = getStyle(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !selected && setSelected(opt.id)}
              className="rounded-2xl px-5 py-4 text-left text-[13px] leading-snug border-2 transition-all"
              style={{
                background:   s.bg,
                borderColor:  s.border,
                color:        s.text,
                cursor:       selected ? 'default' : 'pointer',
              }}
            >
              <span
                className="inline-block w-6 h-6 rounded-full text-center text-[11px] font-bold mr-2 flex-shrink-0"
                style={{
                  background: s.border,
                  color:      opt.id === correctOptionId && selected ? '#fff' : s.text,
                  lineHeight: '24px',
                }}
              >
                {opt.id.toUpperCase()}
              </span>
              {opt.value}
            </button>
          )
        })}
      </div>
      {selected && (
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mt-4 text-[12px] font-mono text-muted underline self-start"
        >
          Reset
        </button>
      )}
    </div>
  )
}

// ─── Fill Blanks ───────────────────────────────────────────────────────────────

function FillBlanksTask({ task }: { task: Task }) {
  const [filled, setFilled] = useState<Record<string, string>>({})
  if (!task.fillBlanks) return null
  const { sentence, blanks, options } = task.fillBlanks

  const usedOptions = new Set(Object.values(filled))
  const nextBlankId = blanks.find(b => !filled[b.id])?.id

  function fillBlank(word: string) {
    if (!nextBlankId) return
    setFilled(f => ({ ...f, [nextBlankId]: word }))
  }

  // Render sentence with blanks
  const parts = sentence.split('___')

  return (
    <div className="flex flex-col h-full px-10 py-8" style={{ background: '#F5F0E8' }}>
      <p className="text-[11px] font-mono uppercase tracking-widest mb-4" style={{ color: '#8A8580' }}>
        Fill in the blanks
      </p>

      {/* Sentence with gaps */}
      <div className="mb-8 text-[16px] leading-[2] flex flex-wrap items-center gap-x-1" style={{ color: '#1A1714' }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks.length && (
              <span
                className="inline-block min-w-[80px] text-center font-semibold rounded-lg px-3 py-0.5 mx-1 border-b-2"
                style={{
                  borderColor: filled[blanks[i].id] ? '#4CAF7D' : '#E8623A',
                  background:  filled[blanks[i].id] ? '#E8F7EF' : '#FEF0EC',
                  color:       filled[blanks[i].id] ? '#2A7A55' : '#8A8580',
                }}
              >
                {filled[blanks[i].id] ?? '?'}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Option chips */}
      <div className="flex flex-wrap gap-2">
        {options?.map(opt => {
          const isUsed = usedOptions.has(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => !isUsed && fillBlank(opt)}
              disabled={isUsed || !nextBlankId}
              className="px-4 py-2 rounded-xl border text-[13px] font-medium transition-all"
              style={{
                background:  isUsed ? '#F0EDE8' : 'white',
                borderColor: isUsed ? '#E8E4DE' : '#D4A017',
                color:       isUsed ? '#C0BAB4' : '#1A1714',
                cursor:      isUsed ? 'default' : 'pointer',
                textDecoration: isUsed ? 'line-through' : 'none',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {Object.keys(filled).length > 0 && (
        <button
          type="button"
          onClick={() => setFilled({})}
          className="mt-4 text-[12px] font-mono text-muted underline self-start"
        >
          Reset
        </button>
      )}
    </div>
  )
}

// ─── Reorder ───────────────────────────────────────────────────────────────────

function ReorderTask({ task }: { task: Task }) {
  const [items, setItems] = useState(() =>
    task.reorder ? [...task.reorder.items].sort(() => Math.random() - 0.5) : []
  )
  const [checked, setChecked] = useState(false)
  if (!task.reorder) return null
  const correct = task.reorder.correctOrder

  function move(from: number, to: number) {
    if (checked) return
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setItems(next)
  }

  const isCorrect = items.map(i => i.id).join(',') === correct.join(',')

  return (
    <div className="flex flex-col h-full px-10 py-8" style={{ background: '#F5F0E8' }}>
      <p className="text-[11px] font-mono uppercase tracking-widest mb-4" style={{ color: '#8A8580' }}>
        Put these in the correct order
      </p>
      <div className="flex flex-col gap-2 flex-1">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border select-none"
            style={{ borderColor: checked && isCorrect ? '#4CAF7D' : '#E8E4DE' }}
          >
            <span className="text-[12px] font-mono text-muted w-5 text-center">{i + 1}</span>
            <span className="text-[13px] leading-snug flex-1" style={{ color: '#1A1714' }}>
              {item.value}
            </span>
            <div className="flex flex-col gap-0.5 opacity-40">
              <button
                type="button"
                onClick={() => i > 0 && move(i, i - 1)}
                disabled={i === 0}
                className="text-[10px] text-muted hover:text-accent disabled:opacity-20"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => i < items.length - 1 && move(i, i + 1)}
                disabled={i === items.length - 1}
                className="text-[10px] text-muted hover:text-accent disabled:opacity-20"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="px-4 py-2 bg-accent text-white text-[12px] font-semibold rounded-xl"
        >
          Check Order
        </button>
        {checked && (
          <p className="text-[12px] font-semibold self-center" style={{ color: isCorrect ? '#4CAF7D' : '#E8623A' }}>
            {isCorrect ? '✓ Correct!' : '✗ Not quite — try again'}
          </p>
        )}
        {checked && !isCorrect && (
          <button
            type="button"
            onClick={() => { setChecked(false); setItems([...task.reorder!.items].sort(() => Math.random() - 0.5)) }}
            className="text-[12px] font-mono text-muted underline self-center"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Flip Multi Card ──────────────────────────────────────────────────────────

function FlipCardTask({ task }: { task: Task }) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  if (!task.flipMultiCard) return null
  const { cards } = task.flipMultiCard

  return (
    <div className="flex flex-col h-full px-10 py-8" style={{ background: '#F5F0E8' }}>
      <p className="text-[11px] font-mono uppercase tracking-widest mb-4" style={{ color: '#8A8580' }}>
        Click cards to reveal what&apos;s on the back
      </p>
      <div
        className="grid gap-3 flex-1"
        style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 3)}, 1fr)` }}
      >
        {cards.map(card => {
          const isFlipped = flipped.has(card.id)
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setFlipped(f => {
                const next = new Set(f)
                if (next.has(card.id)) next.delete(card.id)
                else next.add(card.id)
                return next
              })}
              className="rounded-2xl border-2 p-4 text-left transition-all min-h-[100px] flex flex-col justify-center"
              style={{
                background:  isFlipped ? '#1A1714' : 'white',
                borderColor: isFlipped ? '#E8623A' : '#E8E4DE',
                color:       isFlipped ? '#F5F0E8' : '#1A1714',
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider mb-1.5 block opacity-50">
                {isFlipped ? 'Back' : 'Front'}
              </span>
              <span className="text-[13px] leading-snug font-medium">
                {isFlipped ? card.back : card.front}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

function TableTask({ task }: { task: Task }) {
  if (!task.table) return null
  const { title, headers, rows } = task.table
  return (
    <div className="flex flex-col h-full px-10 py-8 overflow-y-auto" style={{ background: '#FDFAF6' }}>
      {title && (
        <h3 className="font-display text-[20px] font-semibold mb-4" style={{ color: '#1A1714' }}>
          {title}
        </h3>
      )}
      <div className="overflow-hidden rounded-xl border border-[#E8E4DE]">
        <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
          {headers && (
            <thead>
              <tr style={{ background: '#1A1714' }}>
                {headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold text-[#F5F0E8] text-[12px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FDFAF6' }}>
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 border-t border-[#E8E4DE]" style={{ color: '#1A1714' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Bucketing ────────────────────────────────────────────────────────────────

function BucketingTask({ task }: { task: Task }) {
  const raw = task as Record<string, unknown>
  const bucketing = raw.bucketing as {
    buckets: Array<{ id: string; label: string }>
    items:   Array<{ id: string; value: string; bucketId: string }>
  } | undefined

  const [placed, setPlaced] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)

  if (!bucketing) return (
    <div className="flex items-center justify-center h-full" style={{ background: '#F5F0E8' }}>
      <p className="text-muted font-mono text-[12px]">Bucketing preview not available</p>
    </div>
  )

  const unplaced = bucketing.items.filter(i => !placed[i.id])

  return (
    <div className="flex flex-col h-full px-8 py-6 gap-4" style={{ background: '#F5F0E8' }}>
      <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#8A8580' }}>
        Sort each item into the correct category
      </p>
      {/* Buckets */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {bucketing.buckets.map(bucket => {
          const itemsInBucket = bucketing.items.filter(i => placed[i.id] === bucket.id)
          return (
            <div key={bucket.id} className="rounded-2xl border-2 border-dashed border-[#D4A017] bg-white p-4 flex flex-col gap-2">
              <p className="text-[12px] font-semibold text-[#D4A017] font-mono uppercase">{bucket.label}</p>
              <div className="flex flex-col gap-1.5 min-h-[40px]">
                {itemsInBucket.map(item => (
                  <div
                    key={item.id}
                    className="text-[12px] bg-[#F5F0E8] rounded-lg px-3 py-1.5"
                    style={{
                      color: checked ? (item.bucketId === bucket.id ? '#2A7A55' : '#CC3A1F') : '#1A1714'
                    }}
                  >
                    {item.value}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {/* Unplaced items */}
      {unplaced.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unplaced.map(item => (
            <div key={item.id} className="flex gap-1">
              {bucketing.buckets.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setPlaced(p => ({ ...p, [item.id]: b.id }))}
                  className="text-[11px] bg-white border border-[#E8E4DE] rounded-lg px-2 py-1 hover:border-accent"
                  title={`Put in "${b.label}"`}
                >
                  {item.value} → {b.label.slice(0, 6)}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      {unplaced.length === 0 && !checked && (
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="px-4 py-2 bg-accent text-white text-[12px] font-semibold rounded-xl self-start"
        >
          Check Answers
        </button>
      )}
    </div>
  )
}

// ─── Linking ──────────────────────────────────────────────────────────────────

function LinkingTask({ task }: { task: Task }) {
  const raw = task as Record<string, unknown>
  const linking = raw.linking as {
    pairs: Array<{ id: string; left: string; right: string }>
  } | undefined

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matched, setMatched] = useState<Record<string, string>>({})

  if (!linking) return (
    <div className="flex items-center justify-center h-full" style={{ background: '#F5F0E8' }}>
      <p className="text-muted font-mono text-[12px]">Linking preview not available</p>
    </div>
  )

  const leftItems  = linking.pairs.map(p => ({ id: p.id, value: p.left }))
  const rightItems = [...linking.pairs].sort(() => Math.random() - 0.5).map(p => ({ id: p.id, value: p.right }))

  function handleRight(id: string) {
    if (!selectedLeft) return
    setMatched(m => ({ ...m, [selectedLeft]: id }))
    setSelectedLeft(null)
  }

  return (
    <div className="flex flex-col h-full px-10 py-8" style={{ background: '#F5F0E8' }}>
      <p className="text-[11px] font-mono uppercase tracking-widest mb-4" style={{ color: '#8A8580' }}>
        Match each item on the left to the right
      </p>
      <div className="flex gap-6 flex-1">
        {/* Left column */}
        <div className="flex flex-col gap-2 flex-1">
          {leftItems.map(item => {
            const isSelected = selectedLeft === item.id
            const isMatched  = !!matched[item.id]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => !isMatched && setSelectedLeft(isSelected ? null : item.id)}
                className="text-left rounded-xl px-4 py-3 border-2 text-[13px] transition-all"
                style={{
                  background:  isSelected ? '#FEF0EC' : isMatched ? '#E8F7EF' : 'white',
                  borderColor: isSelected ? '#E8623A' : isMatched ? '#4CAF7D' : '#E8E4DE',
                  color:       '#1A1714',
                }}
              >
                {item.value}
              </button>
            )
          })}
        </div>

        {/* Connector dots */}
        <div className="flex flex-col justify-around opacity-20">
          {linking.pairs.map(p => (
            <div key={p.id} className="w-2 h-2 rounded-full bg-accent" />
          ))}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2 flex-1">
          {rightItems.map(item => {
            const matchedLeftId = Object.keys(matched).find(k => matched[k] === item.id)
            const isMatched = !!matchedLeftId
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => !isMatched && selectedLeft && handleRight(item.id)}
                className="text-left rounded-xl px-4 py-3 border-2 text-[13px] transition-all"
                style={{
                  background:  isMatched ? '#E8F7EF' : selectedLeft ? '#FDFAF6' : 'white',
                  borderColor: isMatched ? '#4CAF7D' : selectedLeft ? '#D4A017' : '#E8E4DE',
                  color:       '#1A1714',
                  cursor:      selectedLeft && !isMatched ? 'pointer' : 'default',
                }}
              >
                {item.value}
              </button>
            )
          })}
        </div>
      </div>
      {Object.keys(matched).length > 0 && (
        <button
          type="button"
          onClick={() => { setMatched({}); setSelectedLeft(null) }}
          className="mt-3 text-[12px] font-mono text-muted underline self-start"
        >
          Reset
        </button>
      )}
    </div>
  )
}

// ─── Character Feedback ───────────────────────────────────────────────────────

const FEEDBACK_EMOJIS = [
  { emoji: '😊', label: 'Pretty good',    score: 1 },
  { emoji: '😀', label: 'Great!',          score: 3 },
  { emoji: '🤩', label: 'Amazing!',        score: 5 },
]

function FeedbackTask({ task }: { task: Task }) {
  const [picked, setPicked] = useState<number | null>(null)
  if (!task.characterFeedbackActivity) return null

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-10 py-8 text-center"
      style={{ background: 'linear-gradient(135deg, #1A1714 0%, #2A2420 100%)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-[30px] mb-6"
        style={{ background: 'rgba(232,98,58,0.15)', border: '2px solid rgba(232,98,58,0.3)' }}
      >
        ⭐
      </div>
      <p
        className="text-[16px] leading-relaxed max-w-[500px] mb-8"
        style={{ color: '#F5F0E8' }}
      >
        {task.characterFeedbackActivity.message}
      </p>
      <div className="mb-2">
        <p className="text-[11px] font-mono uppercase tracking-widest mb-4" style={{ color: '#8A8580' }}>
          How do you feel?
        </p>
        <div className="flex gap-4 justify-center">
          {FEEDBACK_EMOJIS.map(f => (
            <button
              key={f.score}
              type="button"
              onClick={() => setPicked(f.score)}
              className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl border-2 transition-all"
              style={{
                background:  picked === f.score ? 'rgba(232,98,58,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: picked === f.score ? '#E8623A' : 'rgba(255,255,255,0.1)',
              }}
            >
              <span className="text-[28px]">{f.emoji}</span>
              <span className="text-[11px] font-medium" style={{ color: picked === f.score ? '#E8623A' : '#8A8580' }}>
                {f.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Unknown template fallback ────────────────────────────────────────────────

function UnknownTask({ task }: { task: Task }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3" style={{ background: '#F5F0E8' }}>
      <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#8A8580' }}>
        Template
      </p>
      <p className="font-mono text-[20px] font-bold" style={{ color: '#1A1714' }}>
        {task.template}
      </p>
      <p className="text-[12px]" style={{ color: '#8A8580' }}>
        Preview not yet available for this template type.
      </p>
    </div>
  )
}

// ─── Main router ──────────────────────────────────────────────────────────────

export function TaskRenderer({ task }: { task: Task }) {
  switch (task.template) {
    case 'activity-conversation':       return <ConversationTask task={task} />
    case 'readonly':                    return <ReadonlyTask task={task} />
    case 'activity-mcq':                return <McqTask task={task} />
    case 'activity-fill-blanks':        return <FillBlanksTask task={task} />
    case 'activity-reorder':            return <ReorderTask task={task} />
    case 'activity-flip-multi-card':    return <FlipCardTask task={task} />
    case 'activity-table':              return <TableTask task={task} />
    case 'activity-bucketing':          return <BucketingTask task={task} />
    case 'activity-linking':            return <LinkingTask task={task} />
    case 'activity-character-feedback': return <FeedbackTask task={task} />
    default:                            return <UnknownTask task={task} />
  }
}
