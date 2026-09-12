/**
 * Berry's animated, voice-visualizing orb.
 *
 * Pure visual: a layered radial-gradient sphere whose pulse, spin and halo
 * reflect the current tutor state. No logic lives here — the overlay owns
 * the state machine; this component only paints it.
 */

import { type CSSProperties } from 'react'

export type BerryState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error' | 'quiet'

interface BerryOrbProps {
  state: BerryState
  size?: number
  label?: string
}

const STATE_META: Record<BerryState, { cls: string; ring: string }> = {
  idle: { cls: 'berry-orb-idle', ring: 'Berry is listening for you' },
  listening: { cls: 'berry-orb-listening', ring: 'Listening… speak now' },
  thinking: { cls: 'berry-orb-thinking', ring: 'Thinking…' },
  speaking: { cls: 'berry-orb-speaking', ring: 'Speaking…' },
  error: { cls: 'berry-orb-error', ring: 'Connection trouble' },
  quiet: { cls: 'berry-orb-quiet', ring: 'Click the mic to talk to Berry' },
}

export function BerryOrb({ state, size = 88, label }: BerryOrbProps) {
  const meta = STATE_META[state] ?? STATE_META.quiet
  const style: CSSProperties = { width: size, height: size }

  return (
    <span className={`berry-orb-wrapper ${meta.cls}`} style={style}>
      <span className="berry-orb-halo" aria-hidden="true" />
      <span className="berry-orb-core" aria-hidden="true" />
      <span className="berry-orb-face" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="berry-orb-label" role="status" aria-live="polite">
        {label ?? meta.ring}
      </span>
    </span>
  )
}