# Animation States Reference

## Max Character — Available Spine Animations

Character: Max
Spine version: 4.1.23
Skeleton: 21 bones, 24 slots
Atlas: 1920×531px spritesheet

### Animation Inventory

| Spine Name   | Duration | Loop | Teacher Label  | Use Case                              |
|--------------|----------|------|----------------|---------------------------------------|
| left_idle    | ~2s      | yes  | Explaining     | Default/calm state, explaining content|
| left_loop    | ~2s      | yes  | Thinking       | Slight movement, pensive              |
| right_idle   | ~2s      | yes  | Surprised      | Facing right, mild reaction           |
| right_loop   | ~2s      | yes  | Celebrating    | Energetic, positive reaction          |

### Bone Hierarchy (Summary)

```
root
└── main
    └── hip
        ├── body
        │   ├── neck
        │   │   └── face
        │   │       ├── eye1 / eye2
        │   │       ├── eyebrow
        │   │       ├── eyeclose1 / eyeclose2
        │   │       ├── lip / lip1 / lip2 / lip3
        │   │       ├── hair / hair2
        │   │       └── ear
        │   ├── l1 (left upper arm)
        │   │   └── l2 (left forearm)
        │   │       └── l3 (left hand)
        │   └── r (right arm chain)
        ├── l leg1 / l leg2
        │   └── shoes2
        └── r leg1 / rleg2
            └── shoes1
```

### Atlas Sprite Regions

The `max.atlas` file maps these named regions from `max.png`:

| Region Name | Description          | Approx Size   |
|-------------|----------------------|---------------|
| body        | Torso / shirt        | 249×413       |
| face        | Head with features   | 285×339       |
| hair        | Front hair           | 427×379       |
| hair2       | Back hair            | 341×299       |
| ear         | Ear                  | 97×96         |
| eye1        | Right eye            | 58×50         |
| eye2        | Left eye             | 83×60         |
| eyebrow     | Eyebrow              | 69×26         |
| eyeclose1   | Eye closed 1         | 169×41        |
| eyeclose2   | Eye closed 2         | 169×65        |
| lip         | Mouth shape          | 32×73         |
| lip1/2/3    | Mouth variants       | ~108×various  |
| neck        | Neck piece           | 100×120       |
| l1/l2/l3    | Left arm segments    | various       |
| r hand22    | Right hand variant   | 75×263        |
| rhan1/3/4/5 | Right hand variants  | various       |
| l leg1/2    | Left leg segments    | 166×494       |
| r leg1/rleg2| Right leg segments   | 135×482       |
| shoes1/2    | Shoe sprites         | various       |

---

## SpineCanvas Component Interface

```typescript
interface SpineCanvasProps {
  character: Character
  animationName: string      // must be one of character.animations[]
  loop?: boolean             // default: true
  speed?: number             // default: 1.0
  backgroundColor?: string  // hex color, default: '#FFFFFF'
  width?: number             // default: 400
  height?: number            // default: 500
  onReady?: () => void
  onError?: (message: string) => void
}
```

### Initialization Pattern (Must Follow Exactly)

```typescript
// SpineCanvas.tsx
'use client'

import { useEffect, useRef } from 'react'
import type { SpinePlayer } from '@esotericsoftware/spine-player'

export function SpineCanvas({ character, animationName, loop = true, speed = 1.0, backgroundColor = '#FFFFFF', onReady, onError }: SpineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<SpinePlayer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (typeof window === 'undefined') return

    // Dynamically import to avoid SSR issues
    import('@esotericsoftware/spine-player').then(({ SpinePlayer }) => {
      if (!containerRef.current) return

      containerRef.current.innerHTML = ''

      playerRef.current = new SpinePlayer(containerRef.current, {
        skelUrl: `${character.id}.json`,
        atlasUrl: `${character.id}.atlas`,
        animation: animationName,
        showControls: false,
        alpha: false,
        backgroundColor,
        rawDataURIs: {
          [`${character.id}.json`]: character.json,        // base64 or raw JSON string
          [`${character.id}.atlas`]: character.atlas,      // raw atlas text
          [`${character.id}.png`]: `data:image/png;base64,${character.png}`,
        },
        success: (player) => {
          playerRef.current = player
          onReady?.()
        },
        error: (_player, message) => {
          onError?.(message)
        },
      })
    })

    return () => {
      try { playerRef.current?.dispose?.() } catch {}
    }
  }, [character.id]) // only re-init if character changes

  // Change animation without re-init
  useEffect(() => {
    try {
      playerRef.current?.animationState?.setAnimation(0, animationName, loop)
    } catch {}
  }, [animationName, loop])

  // Change speed without re-init
  useEffect(() => {
    try {
      if (playerRef.current?.animationState) {
        playerRef.current.animationState.timeScale = speed
      }
    } catch {}
  }, [speed])

  return <div ref={containerRef} style={{ width, height, background: backgroundColor, borderRadius: 16 }} />
}
```

---

## Phase 2 Animation Expansions (Planned)

When new characters are added or Max is extended, these animation states are
reserved for Phase 2 and should show as disabled in the AnimationMapper UI:

| Future Tag  | Teacher Label  | Planned Animation  |
|-------------|----------------|--------------------|
| wave        | Waving         | wave_loop          |
| walk        | Walking        | walk_cycle         |
| sit         | Sitting        | sit_idle           |
| jump        | Jumping        | jump               |
| sad         | Sad            | sad_idle           |
| angry       | Frustrated     | frustrated_idle    |

Show these as locked rows with a "Phase 2" badge in the AnimationMapper component.
Do not wire them up — they are visual placeholders only.
