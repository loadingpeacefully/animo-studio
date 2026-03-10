import type { Character } from '@/lib/types'
import { MAX_CHARACTER } from './max'

// ─── Phase 2 character stubs ─────────────────────────────────────────────────
// locked: true means no assets — cannot be used in lessons yet.

interface CharacterRegistryEntry {
  character: Character | LockedCharacterStub
  locked: boolean
}

interface LockedCharacterStub {
  id: string
  name: string
  description: string
  tags: string[]
  locked: true
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const CHARACTER_REGISTRY: Record<string, CharacterRegistryEntry> = {
  max: {
    character: MAX_CHARACTER,
    locked: false,
  },
  priya: {
    locked: true,
    character: {
      id:          'priya',
      name:        'Priya',
      description: 'Curious and enthusiastic — science and discovery.',
      tags:        ['curious', 'energetic', 'child'],
      locked:      true,
    },
  },
  msgreen: {
    locked: true,
    character: {
      id:          'msgreen',
      name:        'Ms. Green',
      description: 'Calm and wise — history, philosophy, reflection.',
      tags:        ['wise', 'calm', 'adult'],
      locked:      true,
    },
  },
  leo: {
    locked: true,
    character: {
      id:          'leo',
      name:        'Leo',
      description: 'Creative and expressive — art, music, language.',
      tags:        ['creative', 'expressive', 'teen'],
      locked:      true,
    },
  },
  ben: {
    locked: true,
    character: {
      id:          'ben',
      name:        'Ben',
      description: 'Athletic and playful — PE, health, motivation.',
      tags:        ['playful', 'athletic', 'child'],
      locked:      true,
    },
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the Character object for an unlocked character, or null if locked/not found. */
export function getCharacter(id: string): Character | null {
  const entry = CHARACTER_REGISTRY[id]
  if (!entry || entry.locked) return null
  return entry.character as Character
}

export { MAX_CHARACTER }
