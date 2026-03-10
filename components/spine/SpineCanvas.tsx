'use client'

// ─── SpineCanvas ──────────────────────────────────────────────────────────────
// Wraps @esotericsoftware/spine-player@4.1 with rawDataURIs initialization.
// CRITICAL: All Spine animation name literals live ONLY here and in
// lib/animationStates.ts. This component accepts a resolved animation
// name (from SCENE_TAG_ANIMATIONS) — never a raw SceneTag string.
//
// Three-effect pattern:
//   Effect 1 (deps: [character.id])  — full re-init when character changes
//   Effect 2 (deps: [animationName]) — swap animation without re-init
//   Effect 3 (deps: [speed])         — update timeScale without re-init

import { useEffect, useRef } from 'react'
import type { SpinePlayer } from '@esotericsoftware/spine-player'
import type { Character } from '@/lib/types'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SpineCanvasProps {
  character: Character
  /** Resolved Spine animation name from SCENE_TAG_ANIMATIONS — e.g. 'left_idle' */
  animationName: string
  loop?: boolean
  speed?: number
  backgroundColor?: string
  width?: number | string
  height?: number | string
  className?: string
  onReady?: () => void
  onError?: (message: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpineCanvas({
  character,
  animationName,
  loop = true,
  speed = 1.0,
  backgroundColor = '#1C1917',
  width = 400,
  height = 500,
  className = '',
  onReady,
  onError,
}: SpineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef    = useRef<SpinePlayer | null>(null)

  // ── Effect 1: full init / re-init when character changes ─────────────────
  useEffect(() => {
    if (!containerRef.current) return
    if (typeof window === 'undefined') return

    let disposed = false

    import('@esotericsoftware/spine-player').then(({ SpinePlayer }) => {
      if (disposed || !containerRef.current) return

      // Clear any previous player DOM
      containerRef.current.innerHTML = ''

      try {
        // rawDataURIs keys MUST match jsonUrl / atlasUrl values exactly.
        // Atlas first line is 'max.png' so Spine resolves texture via that key.
        playerRef.current = new SpinePlayer(containerRef.current, {
          jsonUrl:              `${character.id}.json`,
          atlasUrl:             `${character.id}.atlas`,
          animation:            animationName,
          showControls:         false,
          alpha:                true,
          preserveDrawingBuffer: false,
          backgroundColor,
          rawDataURIs: {
            [`${character.id}.json`]:  character.json,
            [`${character.id}.atlas`]: character.atlas,
            [`${character.id}.png`]:   `data:image/png;base64,${character.png}`,
          },
          success: (player: SpinePlayer) => {
            if (!disposed) {
              playerRef.current = player
              onReady?.()
            }
          },
          error: (_player: SpinePlayer, message: string) => {
            if (!disposed) onError?.(message)
          },
        })
      } catch (e) {
        if (!disposed) onError?.(`SpineCanvas init error: ${e}`)
      }
    }).catch((e: unknown) => {
      if (!disposed) onError?.(`SpinePlayer import failed: ${e}`)
    })

    return () => {
      disposed = true
      try { playerRef.current?.dispose?.() } catch {}
      playerRef.current = null
    }
  // Only re-run full init when the character identity changes.
  // animationName changes are handled in Effect 2.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id])

  // ── Effect 2: swap animation without full re-init ────────────────────────
  useEffect(() => {
    try {
      playerRef.current?.setAnimation(animationName, loop)
    } catch {}
  }, [animationName, loop])

  // ── Effect 3: update playback speed without full re-init ─────────────────
  useEffect(() => {
    try {
      if (playerRef.current?.animationState) {
        playerRef.current.animationState.timeScale = speed
      }
    } catch {}
  }, [speed])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        background: backgroundColor,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    />
  )
}

// ─── Loading placeholder (shown while Spine imports / inits) ─────────────────

export function SpineCanvasLoading({
  width = 400,
  height = 500,
  className = '',
}: Pick<SpineCanvasProps, 'width' | 'height' | 'className'>) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width, height, borderRadius: 16, background: '#191714' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full spinner" />
        <span className="text-[11px] font-mono text-muted uppercase tracking-widest">Loading Max…</span>
      </div>
    </div>
  )
}
